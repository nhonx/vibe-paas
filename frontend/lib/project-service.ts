import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';
import { projectDb, Project, ProjectCreate } from './db';
import { dockerService } from './docker';
import { nginxService } from './nginx';

const PROJECTS_BASE_PATH = process.env.PROJECTS_BASE_PATH || path.join(process.cwd(), 'data', 'projects');
const PORT_RANGE_START = parseInt(process.env.PORT_RANGE_START || '10000');
const PORT_RANGE_END = parseInt(process.env.PORT_RANGE_END || '20000');

// Ensure projects directory exists
if (!fs.existsSync(PROJECTS_BASE_PATH)) {
  fs.mkdirSync(PROJECTS_BASE_PATH, { recursive: true });
}

function getAvailablePort(): number {
  const usedPorts = projectDb.getUsedPorts();
  for (let i = 0; i < 100; i++) {
    const port = Math.floor(Math.random() * (PORT_RANGE_END - PORT_RANGE_START)) + PORT_RANGE_START;
    if (!usedPorts.includes(port)) {
      return port;
    }
  }
  throw new Error('No available ports');
}

async function prepareProjectDirectory(project: Project): Promise<string> {
  const projectDir = path.join(PROJECTS_BASE_PATH, project.name);

  // Remove existing directory
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }

  fs.mkdirSync(projectDir, { recursive: true });

  if (project.source_type === 'github') {
    // Clone from GitHub
    const git = simpleGit();
    await git.clone(project.source_path, projectDir);
  } else {
    // Copy from local path
    if (!fs.existsSync(project.source_path)) {
      throw new Error(`Source path does not exist: ${project.source_path}`);
    }

    if (fs.statSync(project.source_path).isDirectory()) {
      fs.cpSync(project.source_path, projectDir, { recursive: true });
    } else {
      fs.copyFileSync(project.source_path, path.join(projectDir, path.basename(project.source_path)));
    }
  }

  return projectDir;
}

function createDockerfile(projectDir: string, launchCommand?: string): string {
  const dockerfilePath = path.join(projectDir, 'Dockerfile.generated');

  let content = '';

  // Check for Node.js project
  if (fs.existsSync(path.join(projectDir, 'package.json'))) {
    content = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 80
CMD ${launchCommand || '["npm", "start"]'}
`;
  }
  // Check for Python project
  else if (fs.existsSync(path.join(projectDir, 'requirements.txt'))) {
    content = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 80
CMD ${launchCommand || '["python", "app.py"]'}
`;
  }
  // Check for Go project
  else if (fs.existsSync(path.join(projectDir, 'go.mod'))) {
    content = `FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 80
CMD ${launchCommand || '["./main"]'}
`;
  }
  // Generic
  else {
    content = `FROM ubuntu:22.04
WORKDIR /app
COPY . .
EXPOSE 80
CMD ${launchCommand || '["bash"]'}
`;
  }

  fs.writeFileSync(dockerfilePath, content);
  return dockerfilePath;
}

export const projectService = {
  async createProject(data: ProjectCreate): Promise<Project> {
    // Check if name exists
    const existing = projectDb.getByName(data.name);
    if (existing) {
      throw new Error(`Project with name '${data.name}' already exists`);
    }

    // Create project record
    const project = projectDb.create(data);

    // Allocate port for serverside projects
    if (project.type === 'serverside') {
      const port = getAvailablePort();
      projectDb.update(project.id, { port });
    }

    return projectDb.getById(project.id)!;
  },

  async deployProject(projectId: number): Promise<Project> {
    const project = projectDb.getById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      projectDb.update(projectId, { status: 'building' });

      // Prepare project directory
      const projectDir = await prepareProjectDirectory(project);

      if (project.type === 'static') {
        // Configure Nginx for static site
        nginxService.createStaticConfig(project.subdomain, projectDir);
        projectDb.update(projectId, { status: 'running' });
      } else {
        // Serverside project
        let dockerfilePath = path.join(projectDir, 'Dockerfile');
        if (!fs.existsSync(dockerfilePath)) {
          dockerfilePath = createDockerfile(projectDir, project.launch_command || undefined);
        }

        // Build image
        const imageTag = `paas-${project.name}:latest`;
        const buildSuccess = await dockerService.buildImage(
          projectDir,
          path.basename(dockerfilePath),
          imageTag
        );

        if (!buildSuccess) {
          throw new Error('Failed to build Docker image');
        }

        // Start container
        const containerId = await dockerService.createAndStartContainer({
          image: imageTag,
          name: `paas-${project.name}`,
          port: project.port!
        });

        if (!containerId) {
          throw new Error('Failed to start container');
        }

        projectDb.update(projectId, { container_id: containerId, dockerfile_path: dockerfilePath });

        // Configure Nginx reverse proxy
        nginxService.createProxyConfig(project.subdomain, project.port!);
        projectDb.update(projectId, { status: 'running' });
      }

      return projectDb.getById(projectId)!;
    } catch (error: any) {
      projectDb.update(projectId, {
        status: 'failed',
        error_message: error.message
      });
      throw error;
    }
  },

  async startProject(projectId: number): Promise<Project> {
    const project = projectDb.getById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.status === 'running') {
      return project;
    }

    if (project.type === 'serverside' && project.container_id) {
      const success = await dockerService.startContainer(project.container_id);
      if (!success) {
        throw new Error('Failed to start container');
      }
    }

    projectDb.update(projectId, { status: 'running' });
    return projectDb.getById(projectId)!;
  },

  async stopProject(projectId: number): Promise<Project> {
    const project = projectDb.getById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.type === 'serverside' && project.container_id) {
      await dockerService.stopContainer(project.container_id);
    }

    projectDb.update(projectId, { status: 'stopped' });
    return projectDb.getById(projectId)!;
  },

  async deleteProject(projectId: number): Promise<boolean> {
    const project = projectDb.getById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Remove container
    if (project.container_id) {
      await dockerService.removeContainer(project.container_id);
    }

    // Remove Nginx config
    nginxService.removeConfig(project.subdomain);

    // Remove project directory
    const projectDir = path.join(PROJECTS_BASE_PATH, project.name);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    // Delete from database
    return projectDb.delete(projectId);
  },

  async getProjectLogs(projectId: number, tail: number = 100): Promise<string> {
    const project = projectDb.getById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (project.type === 'serverside' && project.container_id) {
      return await dockerService.getContainerLogs(project.container_id, tail);
    }

    return 'No logs available for static projects';
  }
};
