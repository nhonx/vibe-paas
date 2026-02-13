from sqlalchemy import Column, Integer, String, DateTime, Enum, Text
from datetime import datetime
from database import Base
import enum


class ProjectType(str, enum.Enum):
    STATIC = "static"
    SERVERSIDE = "serverside"


class ProjectStatus(str, enum.Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    BUILDING = "building"
    FAILED = "failed"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(Enum(ProjectType), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.STOPPED)
    
    # Source information
    source_type = Column(String, nullable=False)  # "local" or "github"
    source_path = Column(String, nullable=False)  # local path or github URL
    
    # Deployment information
    subdomain = Column(String, unique=True, nullable=False)
    port = Column(Integer, nullable=True)  # For serverside projects
    container_id = Column(String, nullable=True)  # Docker container ID
    
    # Launch configuration
    launch_command = Column(Text, nullable=True)  # For serverside projects
    dockerfile_path = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional info
    description = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
