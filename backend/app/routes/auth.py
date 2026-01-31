from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from ..config import settings
from ..database import supabase


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    """Login request body."""
    email: EmailStr
    password: str
    role: str  # hod, faculty, student


class LoginResponse(BaseModel):
    """Login response with token."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserProfile(BaseModel):
    """User profile response."""
    id: str
    email: str
    role: str
    name: str


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login endpoint for all user roles."""
    try:
        # Query user from database based on role
        if request.role == "hod":
            result = supabase.table("hod").select("*, users(*)").eq("users.email", request.email).execute()
        elif request.role == "faculty":
            result = supabase.table("faculty").select("*, users(*)").eq("users.email", request.email).execute()
        elif request.role == "student":
            result = supabase.table("students").select("*, users(*)").eq("users.email", request.email).execute()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role specified"
            )
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user_data = result.data[0]
        user = user_data.get("users", {})
        
        # Verify password
        if not verify_password(request.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        token_data = {
            "sub": user.get("id"),
            "email": user.get("email"),
            "role": request.role
        }
        access_token = create_access_token(token_data)
        
        return LoginResponse(
            access_token=access_token,
            user={
                "id": user.get("id"),
                "email": user.get("email"),
                "role": request.role,
                "name": user_data.get("name", "")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
async def logout():
    """Logout endpoint - client should discard the token."""
    return {"message": "Successfully logged out"}
