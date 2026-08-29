from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..database import supabase, supabase_admin
from ..middleware.auth import require_faculty, require_hod, require_any_authenticated, CurrentUser

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def get_phase_label(phase_key: str) -> str:
    mapping = {
        "phase_1": "Phase 1",
        "phase_2": "Phase 2",
        "phase_3": "Phase 3",
    }
    return mapping.get(phase_key, phase_key.replace("_", " ").title())


def calculate_status_score(progress: Dict[str, Any]) -> int:
    marks = [
        progress.get("phase_1_mark", 0) or 0,
        progress.get("phase_2_mark", 0) or 0,
        progress.get("phase_3_mark", 0) or 0,
    ]
    values = [value for value in marks if value is not None]
    if not values:
        return 0
    return int(round(sum(values) / len(values)))


def get_team_lead_member(team_rows: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not team_rows:
        return None
    for row in team_rows:
        if row.get("is_lead") is True:
            return row
    return None


def can_take_team_lead(team_rows: List[Dict[str, Any]], current_user_id: str) -> bool:
    if not any(row.get("student_id") == current_user_id for row in team_rows):
        return False
    return get_team_lead_member(team_rows) is None


async def safe_project_progress(project_id: str) -> Dict[str, Any]:
    try:
        progress_res = supabase.table("project_progress").select("*").eq("project_id", project_id).limit(1).execute()
        progress = (progress_res.data or [{}])[0]
    except Exception:
        progress = {}

    if not progress:
        return {
            "project_id": project_id,
            "phase_1_mark": 0,
            "phase_2_mark": 0,
            "phase_3_mark": 0,
            "current_phase": "phase_1",
            "completion_percentage": 0,
            "faculty_status": "pending",
            "hod_status": "pending",
            "faculty_comment": "",
            "hod_comment": "",
            "team_lead_student_id": None,
        }

    progress["completion_percentage"] = calculate_status_score(progress)
    return progress


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    faculty_id: Optional[str] = None # Guide
    deadline: Optional[str] = None
    status: Optional[str] = "pending"


class TeamAllocate(BaseModel):
    project_id: str
    student_ids: List[str]


class TeamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    faculty_id: str
    student_ids: List[str]
    deadline: Optional[str] = None


class ProjectProgressReview(BaseModel):
    faculty_status: str = "approved"
    faculty_comment: Optional[str] = None


class ProjectProgressMarking(BaseModel):
    phase_1_mark: Optional[int] = 0
    phase_2_mark: Optional[int] = 0
    phase_3_mark: Optional[int] = 0
    hod_comment: Optional[str] = None


class ProjectPhaseUpdate(BaseModel):
    current_phase: str = "phase_1"
    completion_percentage: int = 0
    status: str = "in_progress"
    note: Optional[str] = None


async def attach_project_progress(project: Dict[str, Any]) -> Dict[str, Any]:
    project_id = project.get("id")
    if not project_id:
        return project

    progress = await safe_project_progress(project_id)
    try:
        team_res = supabase.table("project_team").select("*, students(name)").eq("project_id", project_id).execute()
        team_rows = team_res.data or []
    except Exception:
        team_rows = []

    lead_row = get_team_lead_member(team_rows)
    lead_student_id = progress.get("team_lead_student_id") or (lead_row.get("student_id") if lead_row else None)
    lead_name = ((lead_row.get("students") or {}).get("name")) if lead_row else None

    project["progress"] = progress
    project["completion_percentage"] = progress["completion_percentage"]
    project["current_phase"] = get_phase_label(progress.get("current_phase", "phase_1"))
    project["faculty_status"] = progress.get("faculty_status", "pending")
    project["hod_status"] = progress.get("hod_status", "pending")
    project["team_lead_student_id"] = lead_student_id
    project["team_lead_name"] = lead_name
    return project


@router.get("")
async def get_projects(current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        res = supabase.table("projects").select("*, faculty(name)").execute()
        projects = res.data or []

        detailed_projects = []
        for project in projects:
            team_res = supabase.table("project_team").select("*, students(name, roll_number, register_number)").eq("project_id", project["id"]).execute()
            members = team_res.data or []
            project["team_members"] = members
            project["team_member_names"] = [
                member.get("students", {}).get("name")
                for member in members
                if member.get("students") and member["students"].get("name")
            ]
            project["team_count"] = len(members)
            project = await attach_project_progress(project)
            if not project.get("team_lead_name"):
                lead_member = get_team_lead_member(members)
                if lead_member and lead_member.get("students"):
                    project["team_lead_name"] = lead_member["students"].get("name")
                    project["team_lead_student_id"] = lead_member.get("student_id")

            if current_user.role == "faculty" and project.get("faculty_id") != current_user.id:
                continue

            detailed_projects.append(project)

        return {"success": True, "data": detailed_projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress/{project_id}")
async def get_project_progress(project_id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        progress = await safe_project_progress(project_id)
        return {"success": True, "data": progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-projects")
async def get_my_projects(current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        project_team_res = supabase.table("project_team").select("*, projects(*, faculty(name)), students(name, roll_number, register_number)").eq("student_id", current_user.id).execute()
        team_links = project_team_res.data or []
        detailed_projects = []
        for item in team_links:
            project = item.get("projects")
            if not project:
                continue
            team_members_res = supabase.table("project_team").select("*, students(name, roll_number, register_number)").eq("project_id", project["id"]).execute()
            project["team_members"] = team_members_res.data or []
            project = await attach_project_progress(project)
            project["team_member_is_lead"] = bool(item.get("is_lead"))
            if not project.get("team_lead_name"):
                lead_member = next((member for member in (team_members_res.data or []) if member.get("is_lead")), None)
                if lead_member and lead_member.get("students"):
                    project["team_lead_name"] = lead_member["students"].get("name")
                    project["team_lead_student_id"] = lead_member.get("student_id")
            detailed_projects.append(project)
        return {"success": True, "data": detailed_projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/take-lead")
async def take_project_lead(project_id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        team_res = supabase.table("project_team").select("*").eq("project_id", project_id).execute()
        members = team_res.data or []
        if not members:
            raise HTTPException(status_code=404, detail="Project team not found")

        existing_lead = get_team_lead_member(members)
        if not any(member.get("student_id") == current_user.id for member in members):
            raise HTTPException(status_code=403, detail="You are not part of this project team")
        if existing_lead:
            raise HTTPException(status_code=403, detail="A team lead already exists for this project")

        try:
            if "is_lead" in (members[0].keys() if members else []):
                for member in members:
                    supabase_admin.table("project_team").update({"is_lead": member.get("student_id") == current_user.id}).eq("id", member["id"]).execute()
        except Exception:
            pass

        try:
            supabase_admin.table("project_progress").upsert({
                "project_id": project_id,
                "team_lead_student_id": current_user.id,
                "updated_at": "now()",
            }, on_conflict="project_id").execute()
        except Exception:
            pass

        return {"success": True, "message": "Project lead assigned successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/change-lead")
async def change_project_lead(project_id: str, student_id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        if current_user.role not in {"hod", "faculty"}:
            raise HTTPException(status_code=403, detail="Only HOD or faculty can change the team lead")

        team_res = supabase.table("project_team").select("*, students(name)").eq("project_id", project_id).execute()
        members = team_res.data or []
        if not members:
            raise HTTPException(status_code=404, detail="Project team not found")

        if not any(member.get("student_id") == student_id for member in members):
            raise HTTPException(status_code=404, detail="Selected student is not part of this team")

        try:
            if "is_lead" in (members[0].keys() if members else []):
                for member in members:
                    supabase_admin.table("project_team").update({"is_lead": member.get("student_id") == student_id}).eq("id", member["id"]).execute()
        except Exception:
            pass

        supabase_admin.table("project_progress").upsert({
            "project_id": project_id,
            "team_lead_student_id": student_id,
            "updated_at": "now()",
        }, on_conflict="project_id").execute()

        return {"success": True, "message": "Project lead changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/phase-update")
async def update_project_phase(project_id: str, update: ProjectPhaseUpdate, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        team_res = supabase.table("project_team").select("*").eq("project_id", project_id).eq("student_id", current_user.id).execute()
        if not team_res.data:
            raise HTTPException(status_code=403, detail="You are not assigned to this project")

        lead_res = supabase.table("project_team").select("*").eq("project_id", project_id).eq("student_id", current_user.id).execute()
        is_lead = False
        for row in lead_res.data or []:
            if row.get("is_lead"):
                is_lead = True
                break
        if not is_lead:
            progress_res = supabase.table("project_progress").select("*").eq("project_id", project_id).limit(1).execute()
            lead_student_id = (progress_res.data or [{}])[0].get("team_lead_student_id")
            if lead_student_id != current_user.id:
                raise HTTPException(status_code=403, detail="Only the project lead can update the project phase")

        payload = {
            "project_id": project_id,
            "current_phase": update.current_phase,
            "completion_percentage": int(update.completion_percentage),
            "faculty_status": "pending",
            "hod_status": "pending",
            "team_lead_student_id": current_user.id,
            "updated_at": "now()",
        }
        try:
            supabase_admin.table("project_progress").upsert(payload, on_conflict="project_id").execute()
        except Exception:
            pass

        return {"success": True, "data": payload}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress/{project_id}/faculty-review")
async def faculty_review_project(project_id: str, review: ProjectProgressReview, current_user: CurrentUser = Depends(require_faculty)):
    try:
        existing = supabase.table("project_progress").select("*").eq("project_id", project_id).limit(1).execute()
        payload = {
            "project_id": project_id,
            "faculty_status": review.faculty_status,
            "faculty_comment": review.faculty_comment or "",
            "updated_at": "now()",
        }
        if existing.data:
            res = supabase_admin.table("project_progress").update(payload).eq("project_id", project_id).execute()
        else:
            res = supabase_admin.table("project_progress").insert(payload).execute()
        return {"success": True, "data": (res.data or [payload])[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress/{project_id}/hod-review")
async def hod_review_project(project_id: str, marking: ProjectProgressMarking, current_user: CurrentUser = Depends(require_hod)):
    try:
        existing = supabase.table("project_progress").select("*").eq("project_id", project_id).limit(1).execute()
        payload = {
            "project_id": project_id,
            "phase_1_mark": marking.phase_1_mark,
            "phase_2_mark": marking.phase_2_mark,
            "phase_3_mark": marking.phase_3_mark,
            "hod_comment": marking.hod_comment or "",
            "hod_status": "approved",
            "current_phase": "phase_3" if marking.phase_3_mark else ("phase_2" if marking.phase_2_mark else "phase_1"),
            "completion_percentage": calculate_status_score({
                "phase_1_mark": marking.phase_1_mark,
                "phase_2_mark": marking.phase_2_mark,
                "phase_3_mark": marking.phase_3_mark,
            }),
            "updated_at": "now()",
        }
        if existing.data:
            res = supabase_admin.table("project_progress").update(payload).eq("project_id", project_id).execute()
        else:
            res = supabase_admin.table("project_progress").insert(payload).execute()
        return {"success": True, "data": (res.data or [payload])[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{id}")
async def get_project_by_id(id: str, current_user: CurrentUser = Depends(require_any_authenticated)):
    try:
        project_res = supabase.table("projects").select("*, faculty(name)").eq("id", id).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")

        project = await attach_project_progress(project_res.data[0])
        team_res = supabase.table("project_team").select("*, students(name, roll_number, register_number)").eq("project_id", id).execute()

        return {
            "success": True,
            "data": {
                "project": project,
                "team": team_res.data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_project(project: ProjectCreate, current_user: CurrentUser = Depends(require_hod)):
    try:
        data = project.dict()
        res = supabase_admin.table("projects").insert(data).execute()
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{id}")
async def update_project(id: str, project: ProjectCreate, current_user: CurrentUser = Depends(require_hod)):
    try:
        data = project.dict()
        res = supabase_admin.table("projects").update(data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{id}")
async def delete_project(id: str, current_user: CurrentUser = Depends(require_hod)):
    try:
        supabase_admin.table("projects").delete().eq("id", id).execute()
        return {"success": True, "message": "Project deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/allocate-guide")
async def allocate_guide(project_id: str, faculty_id: str, current_user: CurrentUser = Depends(require_hod)):
    try:
        res = supabase_admin.table("projects").update({"faculty_id": faculty_id}).eq("id", project_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-team")
async def create_team(team: TeamCreate, current_user: CurrentUser = Depends(require_hod)):
    try:
        if len(team.student_ids) == 0:
            raise HTTPException(status_code=400, detail="Select at least one student")
        if len(team.student_ids) > 4:
            raise HTTPException(status_code=400, detail="A team can have a maximum of 4 students")

        project_res = supabase_admin.table("projects").insert({
            "title": team.title,
            "description": team.description,
            "faculty_id": team.faculty_id,
            "deadline": team.deadline,
            "status": "pending"
        }).execute()

        if not project_res.data:
            raise HTTPException(status_code=500, detail="Failed to create project team")

        project_id = project_res.data[0]["id"]
        records = [{"project_id": project_id, "student_id": s_id} for s_id in team.student_ids]
        supabase_admin.table("project_team").insert(records).execute()
        supabase_admin.table("project_progress").insert({
            "project_id": project_id,
            "phase_1_mark": 0,
            "phase_2_mark": 0,
            "phase_3_mark": 0,
            "current_phase": "phase_1",
            "completion_percentage": 0,
            "faculty_status": "pending",
            "hod_status": "pending",
            "faculty_comment": "",
            "hod_comment": "",
            "team_lead_student_id": None,
        }).execute()

        return {"success": True, "data": project_res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
