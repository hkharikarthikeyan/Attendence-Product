from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Union


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase Configuration
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_KEY: str = "your-supabase-anon-key"
    SUPABASE_SERVICE_KEY: str = "your-supabase-service-role-key"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Application Settings
    APP_NAME: str = "Student Management System"
    DEBUG: Union[bool, str] = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert DEBUG string to boolean if needed
        if isinstance(self.DEBUG, str):
            self.DEBUG = self.DEBUG.lower() in ('true', '1', 'yes', 'on')
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
