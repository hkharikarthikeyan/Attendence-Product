from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ..database import supabase
from ..middleware.auth import require_faculty, require_student, require_any_authenticated, CurrentUser

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[str] = None
    subject: Optional[str] = None
    faculty_id: Optional[str] = None
    class_year: str
    section: str
    deadline: str
    max_marks: float

class AssignmentEvaluate(BaseModel):
    submission_id: str
    marks_obtained: float
    feedback: Optional[str] = None

class AssignmentSubmission(BaseModel):
    assignment_id: str
    student_id: str
    file_url: Optional[str] = None

@router.get("")
async def get_all_assignments(
    class_year: Optional[str] = None,
    section: Optional[str] = None,
    current_user: CurrentUser = Depends(require_any_authenticated)
):
    try:
        res = supabase.table("assignments").select("*, subjects(name)").execute()
        assignments = res.data if res.data else []

        if class_year:
            assignments = [assignment for assignment in assignments if assignment.get("class_year") == class_year]
        if section:
            assignments = [assignment for assignment in assignments if assignment.get("section") == section]

        if current_user.role == "faculty":
            assignments = [assignment for assignment in assignments if assignment.get("faculty_id") == current_user.id]

        # If user is a student, fetch their submissions and map the status/marks
        if current_user.role == "student":
            student_result = supabase.table("students").select("class_year, section").eq("id", current_user.id).limit(1).execute()
            student = student_result.data[0] if student_result.data else {}
            assignments = [
                assignment for assignment in assignments
                if assignment.get("class_year") == student.get("class_year")
                and assignment.get("section") == student.get("section")
            ]
            submissions_res = supabase.table("assignment_submission")\
                .select("*")\
                .eq("student_id", current_user.id)\
                .execute()
            submissions = {s["assignment_id"]: s for s in submissions_res.data} if submissions_res.data else {}

            for assignment in assignments:
                sub = submissions.get(assignment["id"])
                if sub:
                    assignment["status"] = sub.get("status", "submitted")
                    assignment["marks_obtained"] = sub.get("marks_obtained")
                    assignment["feedback"] = sub.get("feedback")
                    assignment["submission_id"] = sub.get("id")
                    assignment["submission_file_url"] = sub.get("file_url")
                else:
                    assignment["status"] = "pending"
                    assignment["marks_obtained"] = None
                    assignment["feedback"] = None
                    assignment["submission_id"] = None
                    assignment["submission_file_url"] = None

        return {"success": True, "data": assignments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_assignment(assignment: AssignmentCreate, current_user: CurrentUser = Depends(require_faculty)):
    try:
        data = assignment.dict(exclude_none=True)
        data["faculty_id"] = current_user.id
        if not data.get("subject_id"):
            subject_result = supabase.table("subjects").select("id").ilike("name", assignment.subject.strip() if assignment.subject else "").limit(1).execute()
            if subject_result.data:
                data["subject_id"] = subject_result.data[0]["id"]
            else:
                data["subject"] = assignment.subject.strip() if assignment.subject else None
        elif data.get("subject"):
            data.pop("subject", None)
        res = supabase.table("assignments").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except HTTPException:
        raise
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
    submission: AssignmentSubmission,
    current_user: CurrentUser = Depends(require_student)
):
    """Submit an assignment. file_url should be a Base64 data URL string."""
    try:
        data = {
            "assignment_id": submission.assignment_id,
            "student_id": submission.student_id,
            "file_url": submission.file_url,
            "status": "submitted",
            "submission_date": datetime.now().isoformat()
        }
        res = supabase.table("assignment_submission").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/submissions")
async def get_submissions(
    assignment_id: Optional[str] = None,
    class_year: Optional[str] = None,
    section: Optional[str] = None,
    current_user: CurrentUser = Depends(require_faculty)
):
    try:
        query = supabase.table("assignment_submission").select("*, students(name, roll_number, class_year, section), assignments(title)")
        if assignment_id:
            query = query.eq("assignment_id", assignment_id)
        res = query.execute()
        submissions = res.data if res.data else []

        if class_year:
            submissions = [sub for sub in submissions if sub.get("students", {}).get("class_year") == class_year]
        if section:
            submissions = [sub for sub in submissions if sub.get("students", {}).get("section") == section]

        return {"success": True, "data": submissions}
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

@router.get("/class-count")
async def get_class_student_count(
    class_year: str,
    section: str,
    current_user: CurrentUser = Depends(require_faculty)
):
    try:
        result = supabase.table("students").select("id", count="exact").eq("class_year", class_year).eq("section", section).execute()
        return {"count": result.count or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_assignment_by_id(id: UUID, current_user: CurrentUser = Depends(require_any_authenticated)):
    res = supabase.table("assignments").select("*, subjects(name)").eq("id", str(id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"success": True, "data": res.data[0]}
