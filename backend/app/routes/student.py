from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..database import supabase
from ..middleware.auth import require_student, CurrentUser


router = APIRouter(prefix="/api/student", tags=["Student"])


def get_next_leave_status(current_status: str, reviewer_role: str, approved: bool) -> str:
    """Advance the leave request through faculty and HOD approval stages."""
    if current_status == "pending_faculty" and reviewer_role == "faculty":
        return "pending_hod" if approved else "rejected"
    if current_status == "pending_hod" and reviewer_role == "hod":
        return "approved" if approved else "rejected"
    if approved and current_status in {"pending_faculty", "pending_hod"}:
        return "pending_hod" if current_status == "pending_faculty" else "approved"
    return "rejected" if not approved else current_status


# ==================== PROFILE ROUTES ====================

@router.get("/profile")
async def get_profile(current_user: CurrentUser = Depends(require_student)):
    """Get student profile with all details."""
    try:
        # Optimized: Fetch student directly without join to avoid PGRST200 cache issues
        result = supabase.table("students").select("*").eq("id", current_user.id).execute()
        
        if not result.data:
            # If student record missing, return empty structure with status for setup
            # But normally logic requires a row.
            raise HTTPException(status_code=404, detail="Profile not found")
        
        s = result.data[0]
        return {
            "id": s["id"],
            "name": s["name"],
            "email": current_user.email, # Use email from token payload
            "register_number": s["register_number"],
            "roll_number": s["roll_number"],
            "mobile": s.get("mobile"),
            "father_name": s.get("father_name"),
            "mother_name": s.get("mother_name"),
            "class_year": s.get("class_year"),
            "section": s.get("section"),
            "batch": s.get("batch"),
            "approval_status": s.get("approval_status", "pending"),
            "profile_photo": s.get("profile_photo")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProfileUpdateRequest(BaseModel):
    name: str 
    roll_number: str
    register_number: str
    class_year: str
    section: str
    batch: str
    profile_photo: Optional[str] = None

@router.post("/profile-request")
async def request_profile_update(
    request: ProfileUpdateRequest,
    current_user: CurrentUser = Depends(require_student)
):
    """Submit profile details for HOD approval."""
    try:
        data = {
            "name": request.name,
            "email": current_user.email, # Ensure email is stored/updated
            "roll_number": request.roll_number,
            "register_number": request.register_number,
            "class_year": request.class_year,
            "section": request.section,
            "batch": request.batch,
            "profile_photo": request.profile_photo,
            "approval_status": "pending"
        }
        
        # Check if student exists
        existing = supabase.table("students").select("id").eq("id", current_user.id).execute()
        
        if existing.data:
            result = supabase.table("students").update(data).eq("id", current_user.id).execute()
        else:
            # Insert new student record if it doesn't exist
            data["id"] = current_user.id
            # Ensure email is valid if we wanted to store it, but schema might not have it or it's in users table.
            # Referring to schema, students table usually links to users table.
            # We assume users table already has the record from Auth.
            
            # Note: If database requires foreign key to users(id), that should remain ensuring.
            result = supabase.table("students").insert(data).execute()
            
        return {"message": "Profile submitted for approval", "data": request.dict()}
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
        result = supabase.table("marks").select("*, subjects(name)").eq("student_id", current_user.id).execute()
        records = result.data or []

        if subject:
            records = [
                item for item in records
                if ((item.get("subjects") or {}).get("name") or item.get("subject")) == subject
            ]
        if exam_type:
            records = [
                item for item in records
                if item.get("exam_type") == exam_type
            ]

        result = type("Result", (), {"data": records})()
        
        # Calculate overall statistics
        total_obtained = sum(m["marks_obtained"] for m in result.data)
        total_max = sum(m["max_marks"] for m in result.data)
        overall_percentage = (total_obtained / total_max * 100) if total_max > 0 else 0
        
        # Subject-wise breakdown
        subjects = {}
        for record in result.data:
            subj = (record.get("subjects") or {}).get("name") or record.get("subject") or "Unknown"
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
        return {"events": result.data if result.data else []}
    except Exception as e:
        return {"events": []}


# ==================== DASHBOARD SUMMARY ====================

@router.get("/dashboard")
async def get_dashboard(current_user: CurrentUser = Depends(require_student)):
    """Get dashboard summary for student."""
    try:
        # Get profile
        profile = supabase.table("students").select("name, register_number, class_year, section").eq("id", current_user.id).execute()
        
        # Initialize default values
        attendance_stats = {"total_classes": 0, "present": 0, "percentage": 0}
        marks_stats = {"total_obtained": 0, "total_max": 0, "percentage": 0}
        recent_events = []

        # Get attendance summary (Safely)
        try:
            attendance = supabase.table("attendance").select("status").eq("student_id", current_user.id).execute()
            if attendance.data:
                total_attendance = len(attendance.data)
                present = sum(1 for a in attendance.data if a["status"] == "present")
                attendance_percentage = (present / total_attendance * 100) if total_attendance > 0 else 0
                attendance_stats = {
                    "total_classes": total_attendance,
                    "present": present,
                    "percentage": round(attendance_percentage, 2)
                }
        except Exception as ex:
            print(f"Warning: Failed to fetch attendance: {ex}")

        # Get marks summary (Safely)
        try:
            marks = supabase.table("marks").select("marks_obtained, max_marks").eq("student_id", current_user.id).execute()
            if marks.data:
                total_obtained = sum(m["marks_obtained"] for m in marks.data)
                total_max = sum(m["max_marks"] for m in marks.data)
                marks_percentage = (total_obtained / total_max * 100) if total_max > 0 else 0
                marks_stats = {
                    "total_obtained": total_obtained,
                    "total_max": total_max,
                    "percentage": round(marks_percentage, 2)
                }
        except Exception as ex:
             print(f"Warning: Failed to fetch marks: {ex}")
        
        # Get recent events (Safely)
        try:
            events = supabase.table("events").select("*").order("event_date", desc=True).limit(5).execute()
            recent_events = events.data
        except Exception as ex:
             print(f"Warning: Failed to fetch events: {ex}")
        
        return {
            "profile": profile.data[0] if profile.data else {},
            "attendance": attendance_stats,
            "marks": marks_stats,
            "recent_events": recent_events
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Leave Request Models
class LeaveRequestCreate(BaseModel):
    leave_type: str
    from_date: str
    to_date: str
    reason: str

@router.post("/leaves")
async def apply_leave(
    leave: LeaveRequestCreate,
    current_user: CurrentUser = Depends(require_student)
):
    try:
        student_data = supabase.table("students").select("id").eq("id", current_user.id).execute()
        if not student_data.data:
            raise HTTPException(status_code=404, detail="Student profile not found")

        student_id = student_data.data[0]['id']

        try:
            from_d = datetime.strptime(leave.from_date, "%Y-%m-%d").date()
            to_d = datetime.strptime(leave.to_date, "%Y-%m-%d").date()
            if to_d < from_d:
                raise ValueError("To date cannot be before From date")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        leave_data = {
            "user_id": current_user.id,
            "role": "student",
            "leave_type": leave.leave_type,
            "from_date": leave.from_date,
            "to_date": leave.to_date,
            "reason": leave.reason,
            "status": "pending_faculty",
            "updated_at": datetime.now().isoformat()
        }

        result = supabase.table("leave_requests").insert(leave_data).execute()
        return {"message": "Leave application submitted successfully", "data": result.data}

    except Exception as e:
        print(f"Error applying for leave: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaves")
async def get_my_leaves(current_user: CurrentUser = Depends(require_student)):
    try:
        response = supabase.table("leave_requests") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .order("created_at", desc=True) \
            .execute()

        leaves = response.data or []
        for item in leaves:
            item["status_label"] = item.get("status", "pending_faculty")
        return {"leaves": leaves}
    except Exception as e:
        print(f"Error fetching leaves: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/leaves/{request_id}")
async def cancel_leave(
    request_id: str,
    current_user: CurrentUser = Depends(require_student)
):
    try:
        existing = supabase.table("leave_requests") \
            .select("*") \
            .eq("id", request_id) \
            .eq("user_id", current_user.id) \
            .execute()

        if not existing.data:
            raise HTTPException(status_code=404, detail="Leave request not found")

        current_status = existing.data[0].get("status", "pending_faculty")
        if current_status not in {"pending", "pending_faculty", "pending_hod"}:
            raise HTTPException(status_code=400, detail="Cannot cancel a processed leave request")

        supabase.table("leave_requests").delete().eq("id", request_id).execute()
        return {"message": "Leave request cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling leave: {e}")
        raise HTTPException(status_code=500, detail=str(e))
