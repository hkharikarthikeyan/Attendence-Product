from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import auth, hod, faculty, student


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
