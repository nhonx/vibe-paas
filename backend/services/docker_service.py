import docker
from docker.errors import DockerException, NotFound
import logging
from typing import Optional, Dict
import os

logger = logging.getLogger(__name__)


class DockerService:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except DockerException as e:
            logger.error(f"Failed to connect to Docker: {e}")
            self.client = None

    def build_image(self, dockerfile_path: str, tag: str, context_path: str) -> bool:
        """Build a Docker image from a Dockerfile"""
        if not self.client:
            logger.error("Docker client not available")
            return False
        
        try:
            logger.info(f"Building image {tag} from {dockerfile_path}")
            self.client.images.build(
                path=context_path,
                dockerfile=dockerfile_path,
                tag=tag,
                rm=True
            )
            logger.info(f"Successfully built image {tag}")
            return True
        except Exception as e:
            logger.error(f"Failed to build image: {e}")
            return False

    def create_and_start_container(
        self,
        image_tag: str,
        container_name: str,
        port: int,
        environment: Optional[Dict[str, str]] = None,
        volumes: Optional[Dict[str, Dict[str, str]]] = None
    ) -> Optional[str]:
        """Create and start a Docker container"""
        if not self.client:
            logger.error("Docker client not available")
            return None
        
        try:
            # Remove existing container if it exists
            try:
                old_container = self.client.containers.get(container_name)
                old_container.stop()
                old_container.remove()
                logger.info(f"Removed existing container {container_name}")
            except NotFound:
                pass
            
            # Create and start new container
            container = self.client.containers.run(
                image_tag,
                name=container_name,
                ports={'80/tcp': port, '8080/tcp': port},
                environment=environment or {},
                volumes=volumes or {},
                detach=True,
                restart_policy={"Name": "unless-stopped"}
            )
            
            logger.info(f"Started container {container_name} on port {port}")
            return container.id
        except Exception as e:
            logger.error(f"Failed to start container: {e}")
            return None

    def stop_container(self, container_id: str) -> bool:
        """Stop a running container"""
        if not self.client:
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            logger.info(f"Stopped container {container_id}")
            return True
        except NotFound:
            logger.warning(f"Container {container_id} not found")
            return False
        except Exception as e:
            logger.error(f"Failed to stop container: {e}")
            return False

    def start_container(self, container_id: str) -> bool:
        """Start a stopped container"""
        if not self.client:
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.start()
            logger.info(f"Started container {container_id}")
            return True
        except NotFound:
            logger.warning(f"Container {container_id} not found")
            return False
        except Exception as e:
            logger.error(f"Failed to start container: {e}")
            return False

    def remove_container(self, container_id: str) -> bool:
        """Remove a container"""
        if not self.client:
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            container.remove()
            logger.info(f"Removed container {container_id}")
            return True
        except NotFound:
            logger.warning(f"Container {container_id} not found")
            return True  # Already removed
        except Exception as e:
            logger.error(f"Failed to remove container: {e}")
            return False

    def get_container_status(self, container_id: str) -> Optional[str]:
        """Get the status of a container"""
        if not self.client:
            return None
        
        try:
            container = self.client.containers.get(container_id)
            return container.status
        except NotFound:
            return None
        except Exception as e:
            logger.error(f"Failed to get container status: {e}")
            return None

    def get_container_logs(self, container_id: str, tail: int = 100) -> Optional[str]:
        """Get logs from a container"""
        if not self.client:
            return None
        
        try:
            container = self.client.containers.get(container_id)
            logs = container.logs(tail=tail, timestamps=True)
            return logs.decode('utf-8')
        except NotFound:
            return None
        except Exception as e:
            logger.error(f"Failed to get container logs: {e}")
            return None
