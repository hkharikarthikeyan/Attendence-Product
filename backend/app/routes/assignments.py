from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..database import supabase
from ..middleware.auth import require_faculty, require_student, require_any_authenticated, CurrentUser

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: str
    faculty_id: str
    deadline: str
    max_marks: float

class AssignmentEvaluate(BaseModel):
    submission_id: str
    marks_obtained: float
    feedback: Optional[str] = None

@router.get("")
async def get_all_assignments(current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        res = supabase.table("assignments").select("*, subjects(name)").execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_assignment_by_id(id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    res = supabase.table("assignments").select("*, subjects(name)").eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True, "data": res.data[0]}

@router.post("")
async def create_assignment(assignment: AssignmentCreate, current_user: CurrentUser = Depends(require_faculty)):
    try:
        data = assignment.dict()
        res = supabase.table("assignments").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_assignment(id: str, assignment: AssignmentCreate, current_user: CurrentUser = Depends(require_faculty)):
    try:
        data = assignment.dict()
        res = supabase.table("assignments").update(data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_assignment(id: str, current_user: CurrentUser = Depends(require_faculty)):
    try:
        res = supabase.table("assignments").delete().eq("id", id).execute()
        return {"success": True, "message": "Assignment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
async def submit_assignment(
    assignment_id: str = Form(...),
    student_id: str = Form(...),
    file_url: str = Form(None),
    current_user: CurrentUser = Depends(require_student)
):
    try:
        data = {
            "assignment_id": assignment_id,
            "student_id": student_id,
            "file_url": file_url,
            "status": "submitted",
            "submission_date": datetime.now().isoformat()
        }
        res = supabase.table("assignment_submission").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/submissions")
async def get_submissions(assignment_id: Optional[str] = None, current_user: CurrentUser = Depends(require_faculty)):
    try:
        query = supabase.table("assignment_submission").select("*, students(name, roll_number), assignments(title)")
        if assignment_id:
            query = query.eq("assignment_id", assignment_id)
        res = query.execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
async def evaluate_submission(req: AssignmentEvaluate, current_user: CurrentUser = Depends(require_faculty)):
    try:
        res = supabase.table("assignment_submission").update({
            "marks_obtained": req.marks_obtained,
            "feedback": req.feedback,
            "status": "evaluated"
        }).eq("id", req.submission_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Submission not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
