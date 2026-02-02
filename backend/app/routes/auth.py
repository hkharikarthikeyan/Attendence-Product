import bcrypt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from ..config import settings
from ..database import supabase


router = APIRouter(prefix="/api/auth", tags=["Authentication"])




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
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login endpoint for all user roles."""
    try:
        # Get user from users table
        user_result = supabase.table("users").select("*").eq("email", request.email).eq("role", request.role).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = user_result.data[0]
        
        # Verify password
        if not verify_password(request.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get name from role table
        name = ""
        try:
            if request.role == "hod":
                profile = supabase.table("hod").select("name").eq("id", user["id"]).execute()
                name = profile.data[0]["name"] if profile.data else ""
            elif request.role == "faculty":
                profile = supabase.table("faculty").select("name").eq("id", user["id"]).execute()
                name = profile.data[0]["name"] if profile.data else ""
            elif request.role == "student":
                profile = supabase.table("students").select("name").eq("id", user["id"]).execute()
                name = profile.data[0]["name"] if profile.data else ""
        except:
            name = user.get("email", "").split("@")[0]
        
        # Create access token
        token_data = {
            "sub": user["id"],
            "email": user["email"],
            "role": request.role
        }
        access_token = create_access_token(token_data)
        
        return LoginResponse(
            access_token=access_token,
            user={
                "id": user["id"],
                "email": user["email"],
                "role": request.role,
                "name": name
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
