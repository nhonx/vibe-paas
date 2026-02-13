from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models import ProjectType, ProjectStatus


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, pattern="^[a-z0-9-]+$")
    type: ProjectType
    source_type: str = Field(..., pattern="^(local|github)$")
    source_path: str
    launch_command: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    type: ProjectType
    status: ProjectStatus
    source_type: str
    source_path: str
    subdomain: str
    port: Optional[int]
    container_id: Optional[str]
    launch_command: Optional[str]
    dockerfile_path: Optional[str]
    created_at: datetime
    updated_at: datetime
    description: Optional[str]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    description: Optional[str] = None
    launch_command: Optional[str] = None


class StatusResponse(BaseModel):
    message: str
    status: ProjectStatus
