from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/paas.db"
    domain: str = "launch.me"
    nginx_config_path: str = "/etc/nginx/sites-enabled"
    projects_base_path: str = "./data/projects"
    port_range_start: int = 10000
    port_range_end: int = 20000
    
    class Config:
        env_file = ".env"


settings = Settings()
