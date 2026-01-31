from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ..database import supabase
from ..middleware.auth import require_student, CurrentUser


router = APIRouter(prefix="/api/student", tags=["Student"])


# ==================== PROFILE ROUTES ====================

@router.get("/profile")
async def get_profile(current_user: CurrentUser = Depends(require_student)):
    """Get student profile with all details."""
    try:
        result = supabase.table("students").select("*, users(email)").eq("id", current_user.id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        s = result.data[0]
        return {
            "id": s["id"],
            "name": s["name"],
            "email": s["users"]["email"] if s.get("users") else "",
            "register_number": s["register_number"],
            "roll_number": s["roll_number"],
            "mobile": s.get("mobile"),
            "father_name": s.get("father_name"),
            "mother_name": s.get("mother_name"),
            "class_year": s.get("class_year"),
            "section": s.get("section"),
            "batch": s.get("batch")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ATTENDANCE ROUTES ====================

@router.get("/attendance")
async def get_attendance(
    subject: Optional[str] = None,
    current_user: CurrentUser = Depends(require_student)
):
    """Get student's attendance with percentage calculation."""
    try:
        query = supabase.table("attendance").select("*").eq("student_id", current_user.id)
        
        if subject:
            query = query.eq("subject", subject)
        
        result = query.order("date", desc=True).execute()
        
        # Calculate overall statistics
        total = len(result.data)
        present = sum(1 for a in result.data if a["status"] == "present")
        absent = sum(1 for a in result.data if a["status"] == "absent")
        late = sum(1 for a in result.data if a["status"] == "late")
        percentage = (present / total * 100) if total > 0 else 0
        
        # Subject-wise breakdown
        subjects = {}
        for record in result.data:
            subj = record["subject"]
            if subj not in subjects:
                subjects[subj] = {"total": 0, "present": 0}
            subjects[subj]["total"] += 1
            if record["status"] == "present":
                subjects[subj]["present"] += 1
        
        subject_breakdown = []
        for subj, data in subjects.items():
            subject_breakdown.append({
                "subject": subj,
                "total": data["total"],
                "present": data["present"],
                "percentage": round((data["present"] / data["total"] * 100) if data["total"] > 0 else 0, 2)
            })
        
        return {
            "overall": {
                "total_classes": total,
                "present": present,
                "absent": absent,
                "late": late,
                "percentage": round(percentage, 2)
            },
            "subject_breakdown": subject_breakdown,
            "records": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MARKS ROUTES ====================

@router.get("/marks")
async def get_marks(
    subject: Optional[str] = None,
    exam_type: Optional[str] = None,
    current_user: CurrentUser = Depends(require_student)
):
    """Get student's marks with percentage calculation."""
    try:
        query = supabase.table("marks").select("*").eq("student_id", current_user.id)
        
        if subject:
            query = query.eq("subject", subject)
        if exam_type:
            query = query.eq("exam_type", exam_type)
        
        result = query.execute()
        
        # Calculate overall statistics
        total_obtained = sum(m["marks_obtained"] for m in result.data)
        total_max = sum(m["max_marks"] for m in result.data)
        overall_percentage = (total_obtained / total_max * 100) if total_max > 0 else 0
        
        # Subject-wise breakdown
        subjects = {}
        for record in result.data:
            subj = record["subject"]
            if subj not in subjects:
                subjects[subj] = {"obtained": 0, "max": 0, "exams": []}
            subjects[subj]["obtained"] += record["marks_obtained"]
            subjects[subj]["max"] += record["max_marks"]
            subjects[subj]["exams"].append({
                "exam_type": record["exam_type"],
                "marks_obtained": record["marks_obtained"],
                "max_marks": record["max_marks"]
            })
        
        subject_breakdown = []
        for subj, data in subjects.items():
            subject_breakdown.append({
                "subject": subj,
                "total_obtained": data["obtained"],
                "total_max": data["max"],
                "percentage": round((data["obtained"] / data["max"] * 100) if data["max"] > 0 else 0, 2),
                "exams": data["exams"]
            })
        
        return {
            "overall": {
                "total_obtained": total_obtained,
                "total_max": total_max,
                "percentage": round(overall_percentage, 2)
            },
            "subject_breakdown": subject_breakdown,
            "records": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EVENTS ROUTES ====================

@router.get("/events")
async def get_events(current_user: CurrentUser = Depends(require_student)):
    """Get all events for student to view."""
    try:
        result = supabase.table("events").select("*").order("event_date", desc=True).execute()
        return {"events": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DASHBOARD SUMMARY ====================

@router.get("/dashboard")
async def get_dashboard(current_user: CurrentUser = Depends(require_student)):
    """Get dashboard summary for student."""
    try:
        # Get profile
        profile = supabase.table("students").select("name, register_number, class_year, section").eq("id", current_user.id).execute()
        
        # Get attendance summary
        attendance = supabase.table("attendance").select("status").eq("student_id", current_user.id).execute()
        total_attendance = len(attendance.data)
        present = sum(1 for a in attendance.data if a["status"] == "present")
        attendance_percentage = (present / total_attendance * 100) if total_attendance > 0 else 0
        
        # Get marks summary
        marks = supabase.table("marks").select("marks_obtained, max_marks").eq("student_id", current_user.id).execute()
        total_obtained = sum(m["marks_obtained"] for m in marks.data)
        total_max = sum(m["max_marks"] for m in marks.data)
        marks_percentage = (total_obtained / total_max * 100) if total_max > 0 else 0
        
        # Get recent events
        events = supabase.table("events").select("*").order("event_date", desc=True).limit(5).execute()
        
        return {
            "profile": profile.data[0] if profile.data else {},
            "attendance": {
                "total_classes": total_attendance,
                "present": present,
                "percentage": round(attendance_percentage, 2)
            },
            "marks": {
                "total_obtained": total_obtained,
                "total_max": total_max,
                "percentage": round(marks_percentage, 2)
            },
            "recent_events": events.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
