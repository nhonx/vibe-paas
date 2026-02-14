import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Project {
  id: number;
  name: string;
  type: 'static' | 'serverside';
  status: 'stopped' | 'running' | 'building' | 'failed';
  source_type: 'local' | 'github';
  source_path: string;
  subdomain: string;
  port?: number;
  container_port?: number;
  container_id?: string;
  launch_command?: string;
  dockerfile_path?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  error_message?: string;
}

export interface ProjectCreate {
  name: string;
  type: 'static' | 'serverside';
  source_type: 'local' | 'github';
  source_path: string;
  launch_command?: string;
  container_port?: number;
  description?: string;
}

export interface ProjectUpdate {
  description?: string;
  launch_command?: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const projectsApi = {
  // List all projects
  list: async (): Promise<Project[]> => {
    const response = await fetch('/api/projects');
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  // Get a specific project
  get: async (id: number): Promise<Project> => {
    const response = await fetch(`/api/projects/${id}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  // Create a new project
  create: async (data: ProjectCreate): Promise<Project> => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create project');
    }
    return response.json();
  },

  // Update a project
  update: async (id: number, data: ProjectUpdate): Promise<Project> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  // Deploy a project
  deploy: async (id: number): Promise<Project> => {
    const response = await fetch(`/api/projects/${id}/deploy`, {
      method: 'POST'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to deploy project');
    }
    return response.json();
  },

  // Start a project
  start: async (id: number): Promise<{ message: string; status: string }> => {
    const response = await fetch(`/api/projects/${id}/start`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to start project');
    return response.json();
  },

  // Stop a project
  stop: async (id: number): Promise<{ message: string; status: string }> => {
    const response = await fetch(`/api/projects/${id}/stop`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to stop project');
    return response.json();
  },

  // Delete a project
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },

  // Get project logs
  logs: async (id: number, tail: number = 100): Promise<{ logs: string }> => {
    const response = await fetch(`/api/projects/${id}/logs?tail=${tail}`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  },
};

export default api;
