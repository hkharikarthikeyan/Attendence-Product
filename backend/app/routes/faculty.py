from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..database import supabase
from ..middleware.auth import require_faculty, CurrentUser


router = APIRouter(prefix="/api/faculty", tags=["Faculty"])


# ==================== PYDANTIC MODELS ====================

class AttendanceEntry(BaseModel):
    """Single attendance entry."""
    student_id: str
    status: str  # present, absent, late


class AttendanceCreate(BaseModel):
    """Create attendance for a class."""
    class_year: str
    section: str
    subject: str
    date: date
    entries: List[AttendanceEntry]


class MarksEntry(BaseModel):
    """Single marks entry."""
    student_id: str
    marks_obtained: float


class MarksCreate(BaseModel):
    """Create marks for students."""
    class_year: str
    section: str
    subject: str
    exam_type: str  # internal1, internal2, internal3, external
    max_marks: float
    entries: List[MarksEntry]


class ProfileUpdate(BaseModel):
    """Update faculty profile."""
    mobile: Optional[str] = None
    availability_status: Optional[bool] = None


# ==================== PROFILE ROUTES ====================

@router.get("/profile")
async def get_profile(current_user: CurrentUser = Depends(require_faculty)):
    """Get faculty profile."""
    try:
        result = supabase.table("faculty").select("*, users(email)").eq("id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        f = result.data[0]
        return {
            "id": f["id"],
            "name": f["name"],
            "email": f["users"]["email"] if f.get("users") else "",
            "employee_id": f["employee_id"],
            "mobile": f.get("mobile"),
            "department": f.get("department"),
            "availability_status": f.get("availability_status", True)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/profile")
async def update_profile(
    profile: ProfileUpdate,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Update faculty profile."""
    try:
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        result = supabase.table("faculty").update(update_data).eq("id", current_user.id).execute()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CLASSES ROUTES ====================

@router.get("/classes")
async def get_assigned_classes(current_user: CurrentUser = Depends(require_faculty)):
    """Get classes assigned to this faculty."""
    try:
        result = supabase.table("faculty_classes").select("*, classes(*)").eq("faculty_id", current_user.id).execute()
        return {"classes": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students")
async def get_students_by_class(
    class_year: str,
    section: str,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Get students for a specific class."""
    try:
        result = supabase.table("students").select(
            "id, name, register_number, roll_number"
        ).eq("class_year", class_year).eq("section", section).order("roll_number").execute()
        
        return {"students": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ATTENDANCE ROUTES ====================

@router.post("/attendance")
async def mark_attendance(
    attendance: AttendanceCreate,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Mark attendance for a class."""
    try:
        records = []
        for entry in attendance.entries:
            records.append({
                "student_id": entry.student_id,
                "faculty_id": current_user.id,
                "subject": attendance.subject,
                "class_year": attendance.class_year,
                "section": attendance.section,
                "date": attendance.date.isoformat(),
                "status": entry.status
            })
        
        result = supabase.table("attendance").insert(records).execute()
        
        return {
            "message": "Attendance marked successfully",
            "count": len(records)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance/{class_year}/{section}")
async def get_class_attendance(
    class_year: str,
    section: str,
    subject: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Get attendance records for a class."""
    try:
        query = supabase.table("attendance").select(
            "*, students(name, roll_number)"
        ).eq("class_year", class_year).eq("section", section)
        
        if subject:
            query = query.eq("subject", subject)
        if date_from:
            query = query.gte("date", date_from.isoformat())
        if date_to:
            query = query.lte("date", date_to.isoformat())
        
        result = query.order("date", desc=True).execute()
        
        return {"attendance": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance/summary/{class_year}/{section}")
async def get_attendance_summary(
    class_year: str,
    section: str,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Get attendance summary with percentages for a class."""
    try:
        # Get all students in class
        students = supabase.table("students").select(
            "id, name, roll_number"
        ).eq("class_year", class_year).eq("section", section).execute()
        
        summary = []
        for student in students.data:
            attendance = supabase.table("attendance").select("status").eq("student_id", student["id"]).execute()
            total = len(attendance.data)
            present = sum(1 for a in attendance.data if a["status"] == "present")
            percentage = (present / total * 100) if total > 0 else 0
            
            summary.append({
                "student_id": student["id"],
                "name": student["name"],
                "roll_number": student["roll_number"],
                "total_classes": total,
                "present": present,
                "percentage": round(percentage, 2)
            })
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MARKS ROUTES ====================

@router.post("/marks")
async def enter_marks(
    marks: MarksCreate,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Enter marks for students."""
    try:
        records = []
        for entry in marks.entries:
            records.append({
                "student_id": entry.student_id,
                "faculty_id": current_user.id,
                "subject": marks.subject,
                "class_year": marks.class_year,
                "section": marks.section,
                "exam_type": marks.exam_type,
                "max_marks": marks.max_marks,
                "marks_obtained": entry.marks_obtained
            })
        
        result = supabase.table("marks").insert(records).execute()
        
        return {
            "message": "Marks entered successfully",
            "count": len(records)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/marks/{marks_id}")
async def update_marks(
    marks_id: str,
    marks_obtained: float,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Update marks for a student."""
    try:
        result = supabase.table("marks").update({
            "marks_obtained": marks_obtained
        }).eq("id", marks_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Marks record not found")
        
        return {"message": "Marks updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/marks/{class_year}/{section}")
async def get_class_marks(
    class_year: str,
    section: str,
    subject: Optional[str] = None,
    exam_type: Optional[str] = None,
    current_user: CurrentUser = Depends(require_faculty)
):
    """Get marks for a class."""
    try:
        query = supabase.table("marks").select(
            "*, students(name, roll_number)"
        ).eq("class_year", class_year).eq("section", section)
        
        if subject:
            query = query.eq("subject", subject)
        if exam_type:
            query = query.eq("exam_type", exam_type)
        
        result = query.execute()
        
        return {"marks": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EVENTS ROUTES ====================

@router.get("/events")
async def get_events(current_user: CurrentUser = Depends(require_faculty)):
    """Get all events for faculty to view."""
    try:
        result = supabase.table("events").select("*").order("event_date", desc=True).execute()
        return {"events": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
