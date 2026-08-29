import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .services.event_storage import get_event_image_file

if __package__ in (None, ""):
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from app.config import settings
    from app.routes import auth, hod, faculty, student, assignments, projects, settings as sys_settings, notifications
else:
    from .config import settings
    from .routes import auth, hod, faculty, student, assignments, projects, settings as sys_settings, notifications


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Student Management System API - Role-based access for HOD, Faculty, and Students",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(hod.router)
app.include_router(faculty.router)
app.include_router(student.router)
app.include_router(assignments.router)
app.include_router(projects.router)
app.include_router(sys_settings.router)
app.include_router(notifications.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Student Management System API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    try:
        from .database import supabase
        # Test database connection
        supabase.table("students").select("id").limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/api/hod/event-images/{image_id}")
async def serve_event_image(image_id: str):
    try:
        file_obj = get_event_image_file(image_id)
        return StreamingResponse(file_obj, media_type=file_obj.content_type or "application/octet-stream")
    except FileNotFoundError:
        return {"detail": "Event image not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.app:app", host="0.0.0.0", port=8000, reload=True)
