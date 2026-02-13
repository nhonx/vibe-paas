import os
import shutil
import logging
import random
from typing import Optional, List
from sqlalchemy.orm import Session
from git import Repo, GitCommandError
from models import Project, ProjectType, ProjectStatus
from schemas import ProjectCreate, ProjectUpdate
from services.docker_service import DockerService
from services.nginx_service import NginxService
from config import settings

logger = logging.getLogger(__name__)


class ProjectService:
    def __init__(self):
        self.docker_service = DockerService()
        self.nginx_service = NginxService()
        self.projects_base_path = settings.projects_base_path
        os.makedirs(self.projects_base_path, exist_ok=True)

    def _get_available_port(self, db: Session) -> int:
        """Find an available port for a new project"""
        used_ports = {p.port for p in db.query(Project).filter(Project.port.isnot(None)).all()}
        
        for _ in range(100):  # Try 100 times
            port = random.randint(settings.port_range_start, settings.port_range_end)
            if port not in used_ports:
                return port
        
        raise Exception("No available ports found")

    def _prepare_project_directory(self, project: Project) -> str:
        """Prepare project directory from source"""
        project_dir = os.path.join(self.projects_base_path, project.name)
        
        # Remove existing directory if it exists
        if os.path.exists(project_dir):
            shutil.rmtree(project_dir)
        
        os.makedirs(project_dir, exist_ok=True)
        
        if project.source_type == "github":
            # Clone from GitHub
            try:
                logger.info(f"Cloning {project.source_path} to {project_dir}")
                Repo.clone_from(project.source_path, project_dir)
                logger.info(f"Successfully cloned repository")
            except GitCommandError as e:
                logger.error(f"Failed to clone repository: {e}")
                raise Exception(f"Failed to clone repository: {e}")
        else:
            # Copy from local path
            source_path = project.source_path
            if not os.path.exists(source_path):
                raise Exception(f"Source path does not exist: {source_path}")
            
            logger.info(f"Copying from {source_path} to {project_dir}")
            if os.path.isdir(source_path):
                shutil.copytree(source_path, project_dir, dirs_exist_ok=True)
            else:
                shutil.copy2(source_path, project_dir)
        
        return project_dir

    def _create_dockerfile(self, project_dir: str, launch_command: Optional[str]) -> str:
        """Create a Dockerfile for the project"""
        dockerfile_path = os.path.join(project_dir, "Dockerfile.generated")
        
        # Check if package.json exists (Node.js project)
        if os.path.exists(os.path.join(project_dir, "package.json")):
            dockerfile_content = """FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80

CMD ["npm", "start"]
"""
            if launch_command:
                dockerfile_content = dockerfile_content.replace('CMD ["npm", "start"]', f'CMD {launch_command}')
        
        # Check if requirements.txt exists (Python project)
        elif os.path.exists(os.path.join(project_dir, "requirements.txt")):
            dockerfile_content = """FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 80

CMD ["python", "app.py"]
"""
            if launch_command:
                dockerfile_content = dockerfile_content.replace('CMD ["python", "app.py"]', f'CMD {launch_command}')
        
        # Check if go.mod exists (Go project)
        elif os.path.exists(os.path.join(project_dir, "go.mod")):
            dockerfile_content = """FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.* ./
RUN go mod download

COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .

EXPOSE 80

CMD ["./main"]
"""
            if launch_command:
                dockerfile_content = dockerfile_content.replace('CMD ["./main"]', f'CMD {launch_command}')
        
        # Generic Dockerfile
        else:
            dockerfile_content = f"""FROM ubuntu:22.04

WORKDIR /app

COPY . .

EXPOSE 80

CMD {launch_command if launch_command else '["bash"]'}
"""
        
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile_content)
        
        logger.info(f"Created Dockerfile at {dockerfile_path}")
        return dockerfile_path

    def create_project(self, db: Session, project_data: ProjectCreate) -> Project:
        """Create a new project"""
        # Check if project name already exists
        existing = db.query(Project).filter(Project.name == project_data.name).first()
        if existing:
            raise Exception(f"Project with name '{project_data.name}' already exists")
        
        # Create project record
        project = Project(
            name=project_data.name,
            type=project_data.type,
            source_type=project_data.source_type,
            source_path=project_data.source_path,
            subdomain=project_data.name,
            launch_command=project_data.launch_command,
            description=project_data.description,
            status=ProjectStatus.STOPPED
        )
        
        # Allocate port for serverside projects
        if project.type == ProjectType.SERVERSIDE:
            project.port = self._get_available_port(db)
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        logger.info(f"Created project: {project.name}")
        return project

    def deploy_project(self, db: Session, project_id: int) -> Project:
        """Deploy a project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception("Project not found")
        
        try:
            project.status = ProjectStatus.BUILDING
            project.error_message = None
            db.commit()
            
            # Prepare project directory
            project_dir = self._prepare_project_directory(project)
            
            if project.type == ProjectType.STATIC:
                # Configure Nginx for static site
                self.nginx_service.create_static_config(project.subdomain, project_dir)
                project.status = ProjectStatus.RUNNING
                logger.info(f"Deployed static project: {project.name}")
            
            else:  # SERVERSIDE
                # Check if Dockerfile exists
                dockerfile_path = os.path.join(project_dir, "Dockerfile")
                if not os.path.exists(dockerfile_path):
                    # Create Dockerfile
                    dockerfile_path = self._create_dockerfile(project_dir, project.launch_command)
                
                project.dockerfile_path = dockerfile_path
                
                # Build Docker image
                image_tag = f"paas-{project.name}:latest"
                if not self.docker_service.build_image(
                    os.path.basename(dockerfile_path),
                    image_tag,
                    project_dir
                ):
                    raise Exception("Failed to build Docker image")
                
                # Start container
                container_id = self.docker_service.create_and_start_container(
                    image_tag,
                    f"paas-{project.name}",
                    project.port
                )
                
                if not container_id:
                    raise Exception("Failed to start container")
                
                project.container_id = container_id
                
                # Configure Nginx reverse proxy
                self.nginx_service.create_proxy_config(project.subdomain, project.port)
                
                project.status = ProjectStatus.RUNNING
                logger.info(f"Deployed serverside project: {project.name}")
            
            db.commit()
            db.refresh(project)
            return project
        
        except Exception as e:
            logger.error(f"Failed to deploy project: {e}")
            project.status = ProjectStatus.FAILED
            project.error_message = str(e)
            db.commit()
            raise

    def start_project(self, db: Session, project_id: int) -> Project:
        """Start a stopped project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception("Project not found")
        
        if project.status == ProjectStatus.RUNNING:
            return project
        
        try:
            if project.type == ProjectType.SERVERSIDE and project.container_id:
                if self.docker_service.start_container(project.container_id):
                    project.status = ProjectStatus.RUNNING
                    project.error_message = None
                else:
                    raise Exception("Failed to start container")
            else:
                # For static projects, just update status
                project.status = ProjectStatus.RUNNING
                project.error_message = None
            
            db.commit()
            db.refresh(project)
            logger.info(f"Started project: {project.name}")
            return project
        
        except Exception as e:
            logger.error(f"Failed to start project: {e}")
            project.error_message = str(e)
            db.commit()
            raise

    def stop_project(self, db: Session, project_id: int) -> Project:
        """Stop a running project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception("Project not found")
        
        if project.status == ProjectStatus.STOPPED:
            return project
        
        try:
            if project.type == ProjectType.SERVERSIDE and project.container_id:
                self.docker_service.stop_container(project.container_id)
            
            project.status = ProjectStatus.STOPPED
            db.commit()
            db.refresh(project)
            logger.info(f"Stopped project: {project.name}")
            return project
        
        except Exception as e:
            logger.error(f"Failed to stop project: {e}")
            raise

    def delete_project(self, db: Session, project_id: int) -> bool:
        """Delete a project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception("Project not found")
        
        try:
            # Stop and remove container if it exists
            if project.container_id:
                self.docker_service.remove_container(project.container_id)
            
            # Remove Nginx config
            self.nginx_service.remove_config(project.subdomain)
            
            # Remove project directory
            project_dir = os.path.join(self.projects_base_path, project.name)
            if os.path.exists(project_dir):
                shutil.rmtree(project_dir)
            
            # Delete from database
            db.delete(project)
            db.commit()
            
            logger.info(f"Deleted project: {project.name}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete project: {e}")
            raise

    def get_project(self, db: Session, project_id: int) -> Optional[Project]:
        """Get a project by ID"""
        return db.query(Project).filter(Project.id == project_id).first()

    def get_project_by_name(self, db: Session, name: str) -> Optional[Project]:
        """Get a project by name"""
        return db.query(Project).filter(Project.name == name).first()

    def list_projects(self, db: Session) -> List[Project]:
        """List all projects"""
        return db.query(Project).all()

    def update_project(self, db: Session, project_id: int, update_data: ProjectUpdate) -> Project:
        """Update project metadata"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception("Project not found")
        
        if update_data.description is not None:
            project.description = update_data.description
        if update_data.launch_command is not None:
            project.launch_command = update_data.launch_command
        
        db.commit()
        db.refresh(project)
        return project

    def get_project_logs(self, db: Session, project_id: int, tail: int = 100) -> Optional[str]:
        """Get logs for a serverside project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception("Project not found")
        
        if project.type == ProjectType.SERVERSIDE and project.container_id:
            return self.docker_service.get_container_logs(project.container_id, tail)
        
        return None
