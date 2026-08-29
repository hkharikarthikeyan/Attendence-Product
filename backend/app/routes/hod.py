from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from ..database import supabase
from ..middleware.auth import require_hod, CurrentUser
from .auth import get_password_hash
from .student import get_next_leave_status
from ..services.event_storage import save_event_image_bytes, delete_event_image_by_url


router = APIRouter(prefix="/api/hod", tags=["HOD"])


# ==================== PYDANTIC MODELS ====================

class FacultyCreate(BaseModel):
    """Create faculty request."""
    name: str
    email: EmailStr
    password: str
    employee_id: str
    mobile: Optional[str] = None
    department: Optional[str] = None


class FacultyUpdate(BaseModel):
    """Update faculty request."""
    name: Optional[str] = None
    mobile: Optional[str] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    availability_status: Optional[bool] = None
    password: Optional[str] = None


class FacultyResponse(BaseModel):
    """Faculty response."""
    id: str
    name: str
    email: str
    employee_id: str
    mobile: Optional[str] = None
    department: Optional[str] = None
    availability_status: bool = True


class StudentCreate(BaseModel):
    """Create student request."""
    name: str
    email: EmailStr
    password: str
    register_number: str
    roll_number: str
    mobile: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    class_year: Optional[str] = None
    section: Optional[str] = None
    batch: Optional[str] = None


class StudentUpdate(BaseModel):
    """Update student request."""
    name: Optional[str] = None
    mobile: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    class_year: Optional[str] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    email: Optional[EmailStr] = None


class StudentResponse(BaseModel):
    """Student response."""
    id: str
    name: str
    email: str
    register_number: str
    roll_number: str
    mobile: Optional[str] = None
    class_year: Optional[str] = None
    section: Optional[str] = None
    batch: Optional[str] = None


class EventCreate(BaseModel):
    """Create event request."""
    title: str
    description: str
    event_date: datetime
    event_type: str = "general"  # general, academic, cultural, sports
    image_url: Optional[str] = None


class EventResponse(BaseModel):
    """Event response."""
    id: str
    title: str
    description: str
    event_date: datetime
    event_type: str
    created_at: datetime
    image_url: Optional[str] = None



# ==================== FACULTY ROUTES ====================

@router.get("/faculty", response_model=List[FacultyResponse])
async def get_all_faculty(current_user: CurrentUser = Depends(require_hod)):
    """Get all faculty members."""
    try:
        result = supabase.table("faculty").select("*, users(email)").execute()
        faculty_list = []
        for f in result.data:
            faculty_list.append(FacultyResponse(
                id=f["id"],
                name=f["name"],
                email=f["users"]["email"] if f.get("users") else "",
                employee_id=f["employee_id"],
                mobile=f.get("mobile"),
                department=f.get("department"),
                availability_status=f.get("availability_status", True)
            ))
        return faculty_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faculty", response_model=FacultyResponse)
async def create_faculty(
    faculty: FacultyCreate, 
    current_user: CurrentUser = Depends(require_hod)
):
    """Create a new faculty member."""
    try:
        import uuid
        # Fetch role_id
        role_res = supabase.table("roles").select("id").eq("name", "faculty").execute()
        if not role_res.data:
            raise HTTPException(status_code=500, detail="Faculty role not configured in database")
        role_id = role_res.data[0]["id"]
        
        # Generate username
        username = f"fac_{uuid.uuid4().hex[:8]}"

        # Create user record first
        user_result = supabase.table("users").insert({
            "email": faculty.email,
            "username": username,
            "password_hash": get_password_hash(faculty.password),
            "role_id": role_id
        }).execute()
        
        user_id = user_result.data[0]["id"]
        
        # Create faculty profile
        faculty_result = supabase.table("faculty").insert({
            "id": user_id,
            "name": faculty.name,
            "employee_id": faculty.employee_id,
            "mobile": faculty.mobile,
            "department": faculty.department,
            "department_id": None,
            "availability_status": True
        }).execute()
        
        return FacultyResponse(
            id=user_id,
            name=faculty.name,
            email=faculty.email,
            employee_id=faculty.employee_id,
            mobile=faculty.mobile,
            department=faculty.department,
            availability_status=True
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/faculty/{faculty_id}", response_model=FacultyResponse)
async def update_faculty(
    faculty_id: str,
    faculty: FacultyUpdate,
    current_user: CurrentUser = Depends(require_hod)
):
    """Update faculty details."""
    try:
        valid_fields = {"name", "mobile", "employee_id", "department", "availability_status"}
        update_data = {k: v for k, v in faculty.dict().items() if v is not None and k in valid_fields}

        if faculty.password is not None and faculty.password.strip() != "":
            supabase.table("users").update({
                "password_hash": get_password_hash(faculty.password)
            }).eq("id", faculty_id).execute()

        if not update_data and (faculty.password is None or faculty.password.strip() == ""):
            raise HTTPException(status_code=400, detail="No valid fields to update")

        if update_data:
            result = supabase.table("faculty").update(update_data).eq("id", faculty_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Faculty not found")

        # Get updated faculty with email
        updated = supabase.table("faculty").select("*, users(email)").eq("id", faculty_id).execute()
        if not updated.data:
            raise HTTPException(status_code=404, detail="Faculty not found")
        f = updated.data[0]

        return FacultyResponse(
            id=f["id"],
            name=f["name"],
            email=f["users"]["email"] if f.get("users") else "",
            employee_id=f["employee_id"],
            mobile=f.get("mobile"),
            department=f.get("department"),
            availability_status=f.get("availability_status", True)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/faculty/{faculty_id}")
async def delete_faculty(
    faculty_id: str,
    current_user: CurrentUser = Depends(require_hod)
):
    """Delete a faculty member."""
    try:
        # Delete faculty profile first
        supabase.table("faculty").delete().eq("id", faculty_id).execute()
        # Delete user record
        supabase.table("users").delete().eq("id", faculty_id).execute()
        return {"message": "Faculty deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STUDENT ROUTES ====================

@router.get("/students")
async def get_all_students(
    class_year: Optional[str] = None,
    section: Optional[str] = None,
    batch: Optional[str] = None,
    current_user: CurrentUser = Depends(require_hod)
):
    """Get all students with optional filters."""
    try:
        query = supabase.table("students").select("*, users(email)")
        
        if class_year:
            query = query.eq("class_year", class_year)
        if section:
            query = query.eq("section", section)
        if batch:
            query = query.eq("batch", batch)
        
        result = query.execute()
        
        students_list = []
        for s in result.data:
            students_list.append({
                "id": s["id"],
                "name": s["name"],
                "email": (s.get("users") or {}).get("email", ""),
                "register_number": s["register_number"],
                "roll_number": s["roll_number"],
                "mobile": s.get("mobile"),
                "class_year": s.get("class_year"),
                "section": s.get("section"),
                "batch": s.get("batch"),
                "father_name": s.get("father_name"),
                "mother_name": s.get("mother_name"),
                "created_at": s.get("created_at")
            })
        return {"students": students_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/students", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    current_user: CurrentUser = Depends(require_hod)
):
    """Create a new student."""
    try:
        import uuid
        # Fetch role_id
        role_res = supabase.table("roles").select("id").eq("name", "student").execute()
        if not role_res.data:
            raise HTTPException(status_code=500, detail="Student role not configured in database")
        role_id = role_res.data[0]["id"]
        
        # Generate username
        username = f"std_{uuid.uuid4().hex[:8]}"

        # Create user record first
        user_result = supabase.table("users").insert({
            "email": student.email,
            "username": username,
            "password_hash": get_password_hash(student.password),
            "role_id": role_id
        }).execute()
        
        user_id = user_result.data[0]["id"]
        
        # Create student profile
        supabase.table("students").insert({
            "id": user_id,
            "name": student.name,
            "register_number": student.register_number,
            "roll_number": student.roll_number,
            "mobile": student.mobile,
            "father_name": student.father_name,
            "mother_name": student.mother_name,
            "class_year": student.class_year,
            "section": student.section,
            "batch": student.batch,
            "class_id": None
        }).execute()
        
        return StudentResponse(
            id=user_id,
            name=student.name,
            email=student.email,
            register_number=student.register_number,
            roll_number=student.roll_number,
            mobile=student.mobile,
            class_year=student.class_year,
            section=student.section,
            batch=student.batch
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student: StudentUpdate,
    current_user: CurrentUser = Depends(require_hod)
):
    """Update student details."""
    try:
        student_data = student.dict(exclude={"email"})
        update_data = {k: v for k, v in student_data.items() if v is not None}
        result = supabase.table("students").update(update_data).eq("id", student_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Student not found")

        if student.email is not None:
            supabase.table("users").update({"email": student.email}).eq("id", student_id).execute()
        
        updated = supabase.table("students").select("*, users(email)").eq("id", student_id).execute()
        s = updated.data[0]
        
        return StudentResponse(
            id=s["id"],
            name=s["name"],
            email=s["users"]["email"] if s.get("users") else "",
            register_number=s["register_number"],
            roll_number=s["roll_number"],
            mobile=s.get("mobile"),
            class_year=s.get("class_year"),
            section=s.get("section"),
            batch=s.get("batch")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/students/{student_id}")
async def delete_student(
    student_id: str,
    current_user: CurrentUser = Depends(require_hod)
):
    """Delete a student."""
    try:
        supabase.table("students").delete().eq("id", student_id).execute()
        supabase.table("users").delete().eq("id", student_id).execute()
        return {"message": "Student deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STUDENT LEAVE APPROVAL ROUTES ====================

@router.get("/student-leaves")
async def get_student_leaves(current_user: CurrentUser = Depends(require_hod)):
    """Get student leave requests awaiting HOD approval."""
    try:
        result = supabase.table("leave_requests").select("*").eq("role", "student").eq("status", "pending_hod").order("created_at", desc=True).execute()
        requests = result.data or []

        for item in requests:
            user_id = item.get("user_id")
            item["users"] = []
            item["students"] = []

            if user_id:
                user_result = supabase.table("users").select("email").eq("id", user_id).limit(1).execute()
                if user_result.data:
                    item["users"] = user_result.data

                student_result = supabase.table("students").select("name, roll_number, class_year, section").eq("id", user_id).execute()
                if student_result.data:
                    item["students"] = student_result.data
                    item["name"] = student_result.data[0].get("name") or item.get("name")

        return {"requests": requests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/student-leaves/{request_id}")
async def update_student_leave(
    request_id: str,
    status_update: dict,
    current_user: CurrentUser = Depends(require_hod)
):
    """Approve or reject a pending HOD student leave request."""
    try:
        existing = supabase.table("leave_requests").select("status").eq("id", request_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Request not found")

        current_status = existing.data[0].get("status", "pending_hod")
        next_status = get_next_leave_status(current_status, "hod", status_update.get("status") == "approved")

        result = supabase.table("leave_requests").update({
            "status": next_status,
            "updated_at": datetime.now().isoformat(),
            "rejection_reason": status_update.get("rejection_reason")
        }).eq("id", request_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Request not found")

        return {"message": f"Leave request {next_status}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EVENTS ROUTES ====================

@router.get("/events", response_model=List[EventResponse])
async def get_all_events(current_user: CurrentUser = Depends(require_hod)):
    """Get all events."""
    try:
        result = supabase.table("events").select("*").order("event_date", desc=True).execute()
        return [EventResponse(**e) for e in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/events", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    current_user: CurrentUser = Depends(require_hod)
):
    """Create a new event."""
    try:
        image_url = event.image_url
        if image_url and image_url.startswith("data:image"):
            # image_url comes from frontend as Base64 Data URL; store a MongoDB-backed image ref instead
            try:
                import base64

                header, _, data = image_url.partition(",")
                mime_type = header.split(";")[0].replace("data:", "")
                image_bytes = base64.b64decode(data)
                filename = f"event-{datetime.utcnow().timestamp()}.png"
                image_url = save_event_image_bytes(image_bytes, filename, mime_type)
            except Exception:
                image_url = event.image_url

        result = supabase.table("events").insert({
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat(),
            "event_type": event.event_type,
            "created_by": current_user.id,
            "image_url": image_url
        }).execute()

        return EventResponse(**result.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}")
async def update_event(
    event_id: str,
    event: EventCreate,
    current_user: CurrentUser = Depends(require_hod)
):
    """Update an event."""
    try:
        result = supabase.table("events").update({
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat(),
            "event_type": event.event_type,
            "image_url": event.image_url
        }).eq("id", event_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {"message": "Event updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: CurrentUser = Depends(require_hod)
):
    """Delete an event and the associated MongoDB GridFS image when present."""
    try:
        existing = supabase.table("events").select("image_url").eq("id", event_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Event not found")

        image_url = (existing.data[0] or {}).get("image_url")
        if image_url:
            delete_event_image_by_url(image_url)

        supabase.table("events").delete().eq("id", event_id).execute()
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==================== REPORTS ROUTES ====================

@router.get("/reports/attendance")
async def get_attendance_report(
    class_year: Optional[str] = None,
    section: Optional[str] = None,
    current_user: CurrentUser = Depends(require_hod)
):
    """Get attendance report for all or filtered students."""
    try:
        query = supabase.table("students").select("id, name, register_number, class_year, section")
        
        if class_year:
            query = query.eq("class_year", class_year)
        if section:
            query = query.eq("section", section)
        
        students = query.execute()
        
        report = []
        for student in students.data:
            try:
                # Get attendance records
                attendance = supabase.table("attendance").select("status").eq("student_id", student["id"]).execute()
                total = len(attendance.data) if attendance.data else 0
                present = sum(1 for a in attendance.data if a["status"] == "present") if attendance.data else 0
                percentage = (present / total * 100) if total > 0 else 0
                
                report.append({
                    "student_id": student["id"],
                    "name": student["name"],
                    "register_number": student["register_number"],
                    "class_year": student["class_year"],
                    "section": student["section"],
                    "total_classes": total,
                    "present": present,
                    "absent": total - present,
                    "percentage": round(percentage, 2)
                })
            except Exception:
                # If attendance query fails, add student with zero attendance
                report.append({
                    "student_id": student["id"],
                    "name": student["name"],
                    "register_number": student["register_number"],
                    "class_year": student["class_year"],
                    "section": student["section"],
                    "total_classes": 0,
                    "present": 0,
                    "absent": 0,
                    "percentage": 0
                })
        
        return {"report": report}
    except Exception as e:
        # Return empty report if any error occurs
        return {"report": []}


@router.get("/reports/performance")
async def get_performance_report(
    class_year: Optional[str] = None,
    section: Optional[str] = None,
    current_user: CurrentUser = Depends(require_hod)
):
    """Get performance report for all or filtered students."""
    try:
        query = supabase.table("students").select("id, name, register_number, class_year, section")
        
        if class_year:
            query = query.eq("class_year", class_year)
        if section:
            query = query.eq("section", section)
        
        students = query.execute()
        
        report = []
        for student in students.data:
            # Get marks
            marks = supabase.table("marks").select("*").eq("student_id", student["id"]).execute()
            
            total_marks = sum(m.get("marks_obtained", 0) for m in marks.data)
            max_marks = sum(m.get("max_marks", 100) for m in marks.data)
            percentage = (total_marks / max_marks * 100) if max_marks > 0 else 0
            
            report.append({
                "student_id": student["id"],
                "name": student["name"],
                "register_number": student["register_number"],
                "class_year": student["class_year"],
                "section": student["section"],
                "total_marks": total_marks,
                "max_marks": max_marks,
                "percentage": round(percentage, 2)
            })
        
        return {"report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== LEAVE MANAGEMENT ROUTES ====================

@router.get("/faculty-leaves")
async def get_faculty_leaves(current_user: CurrentUser = Depends(require_hod)):
    """Get all faculty leave requests."""
    try:
        # Get leave requests
        result = supabase.table("leave_requests").select("*").eq("role", "faculty").order("created_at", desc=True).execute()
        
        # Enrich with faculty details
        requests = []
        for leave in result.data:
            faculty_data = supabase.table("faculty").select("name, employee_id").eq("id", leave["user_id"]).execute()
            leave["faculty"] = faculty_data.data[0] if faculty_data.data else {"name": "Unknown", "employee_id": "N/A"}
            requests.append(leave)
        
        return {"requests": requests}
    except Exception as e:
        print(f"Error fetching faculty leaves: {str(e)}")
        return {"requests": []}


@router.put("/faculty-leaves/{request_id}")
async def update_faculty_leave(
    request_id: str,
    status_update: dict,
    current_user: CurrentUser = Depends(require_hod)
):
    """Approve or reject faculty leave request."""
    try:
        result = supabase.table("leave_requests").update({
            "status": status_update.get("status"),
            "updated_at": datetime.now().isoformat()
        }).eq("id", request_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        return {"message": f"Leave request {status_update.get('status')}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
