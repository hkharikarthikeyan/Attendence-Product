from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional, List
from ..config import settings
from ..database import supabase


security = HTTPBearer()


class TokenData(BaseModel):
    """Token payload data."""
    user_id: str
    email: str
    role: str


class CurrentUser(BaseModel):
    """Current authenticated user."""
    id: str
    email: str
    role: str
    name: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CurrentUser:
    """Verify JWT token and return current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or role is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    return CurrentUser(id=user_id, email=email, role=role)


def require_role(allowed_roles: List[str]):
    """Dependency to check if user has required role."""
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker


# Role-specific dependencies
require_hod = require_role(["hod"])
require_faculty = require_role(["faculty", "hod"])
require_student = require_role(["student"])
require_any_authenticated = require_role(["hod", "faculty", "student"])
