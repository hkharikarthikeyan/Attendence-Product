from app.routes.projects import get_phase_label, calculate_status_score, can_take_team_lead


def test_get_phase_label_uses_readable_names():
    assert get_phase_label("phase_1") == "Phase 1"
    assert get_phase_label("phase_2") == "Phase 2"
    assert get_phase_label("phase_3") == "Phase 3"


def test_calculate_status_score_averages_phase_marks():
    progress = {
        "phase_1_mark": 70,
        "phase_2_mark": 80,
        "phase_3_mark": 90,
    }
    assert calculate_status_score(progress) == 80


def test_can_take_team_lead_only_when_no_lead_exists_for_member():
    team = [
        {"student_id": "a1", "is_lead": False},
        {"student_id": "b2", "is_lead": False},
    ]
    assert can_take_team_lead(team, "a1") is True
    assert can_take_team_lead(team, "b2") is True

    team_with_lead = [
        {"student_id": "a1", "is_lead": True},
        {"student_id": "b2", "is_lead": False},
    ]
    assert can_take_team_lead(team_with_lead, "b2") is False
    assert can_take_team_lead(team_with_lead, "a1") is False
