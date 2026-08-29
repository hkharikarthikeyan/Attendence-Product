import math
import bcrypt
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from typing import Optional
from ..config import settings
from ..database import supabase
from ..middleware.auth import get_current_user, CurrentUser

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ==================== PYDANTIC MODELS ====================

class LoginRequest(BaseModel):
    email: str  # Can be email or username
    password: str
    role: str   # hod, faculty, student

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class FirstLoginPasswordChangeRequest(BaseModel):
    email: str
    current_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    name: str
    mobile: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None

# ==================== HELPERS ====================

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def format_lockout_message(locked_until_value) -> str:
    """Return a user-friendly lockout message in minutes for the frontend."""
    if not locked_until_value:
        return "Account locked. Try again later."

    try:
        if isinstance(locked_until_value, str):
            lock_time = datetime.fromisoformat(locked_until_value.replace("Z", "+00:00"))
        else:
            lock_time = locked_until_value

        if lock_time.tzinfo is None:
            lock_time = lock_time.replace(tzinfo=timezone.utc)

        remaining_seconds = (lock_time - datetime.now(timezone.utc)).total_seconds()
        if remaining_seconds <= 0:
            return "Account locked. Try again later."

        remaining_minutes = max(1, math.ceil(remaining_seconds / 60))
        suffix = "" if remaining_minutes == 1 else "s"
        return f"Account locked. Try again after {remaining_minutes} minute{suffix}"
    except (TypeError, ValueError):
        return "Account locked. Try again later."

# ==================== ENDPOINTS ====================

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        # Determine if email or username is provided
        login_identifier = request.email.strip()
        user_query = supabase.table("users").select("*, roles(name)")
        if "@" in login_identifier:
            user_result = user_query.ilike("email", login_identifier).execute()
        else:
            user_result = user_query.ilike("username", login_identifier).execute()

        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password"
            )

        user = user_result.data[0]
        role_name = user["roles"]["name"]

        # Validate Role Matches Request
        if role_name != request.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied for this role"
            )

        # Check Account Lock status
        locked_until_value = user.get("locked_until")
        if locked_until_value:
            try:
                locked_until = datetime.fromisoformat(str(locked_until_value).replace("Z", "+00:00"))
                if locked_until.tzinfo is None:
                    locked_until = locked_until.replace(tzinfo=timezone.utc)

                if datetime.now(timezone.utc) < locked_until:
                    raise HTTPException(
                        status_code=status.HTTP_423_LOCKED,
                        detail=format_lockout_message(locked_until_value)
                    )

                # Lockout has expired; clear it so the user can retry without a stale countdown.
                supabase.table("users").update({
                    "failed_login_attempts": 0,
                    "locked_until": None
                }).eq("id", user["id"]).execute()
            except (TypeError, ValueError):
                pass

        # Verify Password
        password_valid = verify_password(request.password, user.get("password_hash", ""))

        # Bulk-uploaded students use their roll number as the initial password.
        # Compare it case-insensitively so Excel casing does not affect login.
        if not password_valid and role_name == "student" and user.get("first_login", True):
            student_profile = supabase.table("students").select("roll_number").eq("id", user["id"]).execute()
            roll_number = student_profile.data[0].get("roll_number") if student_profile.data else None
            password_valid = bool(roll_number and request.password.strip().lower() == str(roll_number).strip().lower())

        if not password_valid:
            # Log Failed Attempt
            attempts = user.get("failed_login_attempts", 0) + 1
            update_data = {"failed_login_attempts": attempts}
            if attempts >= 5:
                # Lock for 15 minutes
                lock_time = datetime.now(timezone.utc) + timedelta(minutes=15)
                update_data["locked_until"] = lock_time.isoformat()
            
            supabase.table("users").update(update_data).eq("id", user["id"]).execute()
            
            # Log Login History
            supabase.table("login_history").insert({
                "user_id": user["id"],
                "status": "failed"
            }).execute()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password"
            )

        # Reset failed attempts on success
        supabase.table("users").update({
            "failed_login_attempts": 0,
            "locked_until": None
        }).eq("id", user["id"]).execute()

        # Log Success Login History
        supabase.table("login_history").insert({
            "user_id": user["id"],
            "status": "success"
        }).execute()

        # Fetch Name
        name = ""
        try:
            if role_name == "hod":
                profile = supabase.table("hod").select("name").eq("id", user["id"]).execute()
                name = profile.data[0]["name"] if profile.data else ""
            elif role_name == "faculty":
                profile = supabase.table("faculty").select("name").eq("id", user["id"]).execute()
                name = profile.data[0]["name"] if profile.data else ""
            elif role_name == "student":
                profile = supabase.table("students").select("name").eq("id", user["id"]).execute()
                name = profile.data[0]["name"] if profile.data else ""
        except Exception:
            name = user["username"]

        # Check password expiry
        password_expired = False
        if user.get("password_expires_at"):
            exp_date = datetime.fromisoformat(user["password_expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp_date:
                password_expired = True

        token_data = {
            "sub": user["id"],
            "email": user["email"],
            "role": role_name
        }
        access_token = create_access_token(token_data)

        return LoginResponse(
            access_token=access_token,
            user={
                "id": user["id"],
                "email": user["email"],
                "username": user["username"],
                "role": role_name,
                "name": name,
                "first_login": user.get("first_login", True),
                "password_expired": password_expired
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
async def logout(current_user: CurrentUser = Depends(get_current_user)):
    # Simply log out
    return {"success": True, "message": "Successfully logged out"}

@router.post("/refresh-token")
async def refresh_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        
        # Issue new token
        new_token = create_access_token({"sub": user_id, "email": email, "role": role})
        return {"access_token": new_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Log reset request / In a real app we'd send email.
    # For SMS product mock, we output success
    return {"success": True, "message": "Password reset token sent to your email"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user_result = supabase.table("users").select("id").eq("email", request.email).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    hashed_pwd = get_password_hash(request.new_password)
    supabase.table("users").update({"password_hash": hashed_pwd}).eq("email", request.email).execute()
    return {"success": True, "message": "Password has been reset successfully"}

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: CurrentUser = Depends(get_current_user)):
    user_result = supabase.table("users").select("*").eq("id", current_user.id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = user_result.data[0]
    if not verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_pwd = get_password_hash(request.new_password)
    supabase.table("users").update({
        "password_hash": hashed_pwd,
        "password_expires_at": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
    }).eq("id", current_user.id).execute()
    
    # Track password history
    supabase.table("password_history").insert({
        "user_id": current_user.id,
        "password_hash": hashed_pwd
    }).execute()
    
    return {"success": True, "message": "Password changed successfully"}

@router.post("/first-login-password-change")
async def first_login_password_change(request: FirstLoginPasswordChangeRequest):
    user_result = supabase.table("users").select("*").eq("email", request.email).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = user_result.data[0]
    if not verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    hashed_pwd = get_password_hash(request.new_password)
    supabase.table("users").update({
        "password_hash": hashed_pwd,
        "first_login": False,
        "password_expires_at": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
    }).eq("id", user["id"]).execute()
    
    return {"success": True, "message": "Initial password changed successfully. You can now login."}

@router.post("/verify-token")
async def verify_token(current_user: CurrentUser = Depends(get_current_user)):
    return {"valid": True, "user": current_user}

@router.get("/profile")
async def get_profile(current_user: CurrentUser = Depends(get_current_user)):
    # Fetch from appropriate table
    if current_user.role == "hod":
        res = supabase.table("hod").select("*").eq("id", current_user.id).execute()
    elif current_user.role == "faculty":
        res = supabase.table("faculty").select("*").eq("id", current_user.id).execute()
    else:
        res = supabase.table("students").select("*").eq("id", current_user.id).execute()
        
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "data": res.data[0]}

@router.put("/profile")
async def update_profile(request: ProfileUpdate, current_user: CurrentUser = Depends(get_current_user)):
    table = "hod" if current_user.role == "hod" else ("faculty" if current_user.role == "faculty" else "students")
    
    update_data = {
        "name": request.name,
        "mobile": request.mobile
    }
    if current_user.role == "student":
        if request.father_name:
            update_data["father_name"] = request.father_name
        if request.mother_name:
            update_data["mother_name"] = request.mother_name
            
    res = supabase.table(table).update(update_data).eq("id", current_user.id).execute()
    return {"success": True, "data": res.data}
