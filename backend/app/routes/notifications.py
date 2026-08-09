from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..database import supabase
from ..middleware.auth import require_any_authenticated, require_hod, CurrentUser

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationCreate(BaseModel):
    title: str
    message: str
    user_id: Optional[str] = None # NULL means global announcement

@router.get("")
async def get_notifications(current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        # Get notifications for this user + global notifications (user_id IS NULL)
        res = supabase.table("notifications")\
            .select("*")\
            .or_(f"user_id.eq.{current_user.id},user_id.is.null")\
            .order("created_at", desc=True)\
            .execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_notification(notification: NotificationCreate, current_user: CurrentUser = Depends(require_hod)):
    try:
        data = notification.dict()
        res = supabase.table("notifications").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/read/{id}")
async def mark_as_read(id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        res = supabase.table("notifications").update({"is_read": True}).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_notification(id: str, current_user: CurrentUser = Depends(require_hod)):
    try:
        res = supabase.table("notifications").delete().eq("id", id).execute()
        return {"success": True, "message": "Notification deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
