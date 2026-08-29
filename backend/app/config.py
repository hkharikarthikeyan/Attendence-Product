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
    
    # MongoDB Configuration (event images)
    MONGODB_URI: str = "mongodb+srv://kharikumarhd690_db_user:Hari123@cluster0.2ymcs7z.mongodb.net/?appName=Cluster0"
    MONGODB_DB_NAME: str = "college_app"
    MONGODB_EVENTS_BUCKET: str = "event_images"

    # Backend base URL used when returning stored image URLs to the frontend
    BACKEND_BASE_URL: str = "http://localhost:8000"

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
