from app.routes.student import get_next_leave_status


def test_leave_status_advances_for_faculty_and_hod_approval_flow():
    assert get_next_leave_status("pending_faculty", "faculty", True) == "pending_hod"
    assert get_next_leave_status("pending_hod", "hod", True) == "approved"
    assert get_next_leave_status("pending_faculty", "faculty", False) == "rejected"
    assert get_next_leave_status("pending_hod", "hod", False) == "rejected"
