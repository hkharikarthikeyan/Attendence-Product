from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from ..database import supabase
from ..middleware.auth import require_hod, CurrentUser

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    key: str
    value: Dict[str, Any]

@router.get("")
async def get_settings(current_user: CurrentUser = Depends(require_hod)):
    try:
        res = supabase.table("settings").select("*").execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
async def update_settings(req: SettingsUpdate, current_user: CurrentUser = Depends(require_hod)):
    try:
        res = supabase.table("settings").upsert({
            "key": req.key,
            "value": req.value,
            "updated_at": "now()"
        }).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
