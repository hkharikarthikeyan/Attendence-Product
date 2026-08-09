from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from ..database import supabase
from ..middleware.auth import require_faculty, require_hod, require_any_authenticated, CurrentUser

router = APIRouter(prefix="/api/projects", tags=["Projects"])

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    faculty_id: Optional[str] = None # Guide
    deadline: Optional[str] = None
    status: Optional[str] = "pending"

class TeamAllocate(BaseModel):
    project_id: str
    student_ids: List[str]

@router.get("")
async def get_projects(current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        res = supabase.table("projects").select("*, faculty(name)").execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_project_by_id(id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        project_res = supabase.table("projects").select("*, faculty(name)").eq("id", id).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
            
        # Get team members
        team_res = supabase.table("project_team").select("*, students(name, roll_number)").eq("project_id", id).execute()
        
        return {
            "success": True,
            "data": {
                "project": project_res.data[0],
                "team": team_res.data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_project(project: ProjectCreate, current_user: CurrentUser = Depends(require_hod)):
    try:
        data = project.dict()
        res = supabase.table("projects").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_project(id: str, project: ProjectCreate, current_user: CurrentUser = Depends(require_hod)):
    try:
        data = project.dict()
        res = supabase.table("projects").update(data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_project(id: str, current_user: CurrentUser = Depends(require_hod)):
    try:
        res = supabase.table("projects").delete().eq("id", id).execute()
        return {"success": True, "message": "Project deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/allocate-guide")
async def allocate_guide(project_id: str, faculty_id: str, current_user: CurrentUser = Depends(require_hod)):
    try:
        res = supabase.table("projects").update({"faculty_id": faculty_id}).eq("id", project_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-team")
async def create_team(allocation: TeamAllocate, current_user: CurrentUser = Depends(require_hod)):
    try:
        records = [{"project_id": allocation.project_id, "student_id": s_id} for s_id in allocation.student_ids]
        res = supabase.table("project_team").insert(records).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
