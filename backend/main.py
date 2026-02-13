from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import logging

from database import get_db, init_db
from schemas import ProjectCreate, ProjectResponse, ProjectUpdate, StatusResponse
from services.project_service import ProjectService
from models import ProjectStatus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PaaS Management API",
    description="API for managing static and serverside project deployments",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database...")
    init_db()
    logger.info("Application started successfully")

# Initialize project service
project_service = ProjectService()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "PaaS Management API is running"}


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "database": "connected"
        }
    }


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project"""
    try:
        project = project_service.create_project(db, project_data)
        logger.info(f"Created project: {project.name}")
        return project
    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    """List all projects"""
    try:
        projects = project_service.list_projects(db)
        return projects
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific project by ID"""
    try:
        project = project_service.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    update_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update project metadata"""
    try:
        project = project_service.update_project(db, project_id, update_data)
        logger.info(f"Updated project: {project.name}")
        return project
    except Exception as e:
        logger.error(f"Failed to update project: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/projects/{project_id}/deploy", response_model=ProjectResponse)
async def deploy_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Deploy a project"""
    try:
        project = project_service.deploy_project(db, project_id)
        logger.info(f"Deployed project: {project.name}")
        return project
    except Exception as e:
        logger.error(f"Failed to deploy project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/projects/{project_id}/start", response_model=StatusResponse)
async def start_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Start a stopped project"""
    try:
        project = project_service.start_project(db, project_id)
        return StatusResponse(
            message=f"Project '{project.name}' started successfully",
            status=project.status
        )
    except Exception as e:
        logger.error(f"Failed to start project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/projects/{project_id}/stop", response_model=StatusResponse)
async def stop_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Stop a running project"""
    try:
        project = project_service.stop_project(db, project_id)
        return StatusResponse(
            message=f"Project '{project.name}' stopped successfully",
            status=project.status
        )
    except Exception as e:
        logger.error(f"Failed to stop project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete a project"""
    try:
        project_service.delete_project(db, project_id)
        logger.info(f"Deleted project ID: {project_id}")
        return None
    except Exception as e:
        logger.error(f"Failed to delete project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects/{project_id}/logs")
async def get_project_logs(
    project_id: int,
    tail: int = 100,
    db: Session = Depends(get_db)
):
    """Get logs for a serverside project"""
    try:
        logs = project_service.get_project_logs(db, project_id, tail)
        if logs is None:
            return {"logs": "No logs available for this project"}
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Failed to get project logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
