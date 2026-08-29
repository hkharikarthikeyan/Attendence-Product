# Attendance Product

A role-based academic management system built for managing students, faculty, attendance, assignments, projects, leave requests, events, and departmental reporting.

The project combines a FastAPI backend with a React + Vite frontend and uses:
- Supabase/PostgreSQL for the main application data
- MongoDB Atlas GridFS for event image storage
- JWT-based authentication with role-based access control

## Overview

This application supports three primary user roles:
- HOD: manages students, faculty, events, assignments, projects, reports, and approvals
- Faculty: tracks attendance, enters marks, manages assignment reviews, and handles leave requests
- Student: views profile data, attendance, marks, project progress, events, and submits leave requests

## Features

### Authentication and Access Control
- Login for HOD, faculty, and student roles
- JWT session handling
- Lockout logic after repeated failed attempts
- Password validation and role-based authorization

### Class Advisor Assignment and Student Management Logic

#### 1. HOD – Assign Class Advisors
The HOD can assign faculty members as Class Advisors for specific classes and sections.

Example:
- Sudha → Class Advisor for 3rd Year – Section A
- Nithya → Class Advisor for 2nd Year – Section B

Each class and section has one assigned Class Advisor, and the HOD can add, update, or change that assignment whenever required.

#### 2. Faculty Dashboard – My Class
Once a faculty member is assigned as a Class Advisor, a My Class option appears on the faculty dashboard.

The My Class page displays only the students belonging to the assigned class and section.

Example:
- Sudha's Dashboard → My Class → 3rd Year – Section A students only

The page should include:
- Student Name
- Register Number / Student ID
- Attendance Percentage
- Internal Marks
- Project Marks
- Overall Academic Performance

The faculty can only access the data of students within their assigned class and section.

#### 3. Leave Request Workflow
The student leave request follows a two-level approval workflow:

Student → Class Advisor → HOD

Step 1: Student submits a leave request with leave date/duration, reason, and supporting documents when needed.

Step 2: The request is visible only to the Class Advisor for that student’s class and section. Other faculty members cannot view or approve it.

The Class Advisor can approve or reject the request.

Step 3: If approved by the Class Advisor, the request moves to the HOD dashboard for final approval.

Workflow status:
- Pending
- Class Advisor Approval
- HOD Approval
- Final Status

If the Class Advisor rejects the request, it does not move to the HOD.

#### Access Control Summary

| Role | Access |
| --- | --- |
| Student | Submit leave requests and view leave status |
| Class Advisor | View and review leave requests only from their assigned class |
| Faculty | View academic/project data based on assigned students or responsibilities |
| HOD | Assign Class Advisors and provide final approval for leave requests |

This ensures student data and leave requests are managed according to class, section, and faculty responsibility.

### Student and Faculty Management
- Student creation and profile management
- Faculty onboarding and profile updates
- Class year and section-based organization
- Bulk student import workflows

### Attendance and Marks
- Attendance marking by faculty
- Attendance summaries and reports
- Marks entry and academic performance tracking
- Percentage-based reporting and analytics

### Assignments
- Faculty assignment creation and uploads
- Student assignment submissions
- Submission review and grading logic
- HOD visibility for assignment progress and non-submission reporting

### Projects and Team Work
- Project allocation by HOD
- Student team creation and project assignment
- Team lead selection
- Phase-wise project progress tracking
- Faculty/HOD review and final marks computation
- Average-based final project score calculation

### Leave Workflow
- Student leave request flow
- Faculty approval flow
- HOD final approval flow
- Tracking of leave request status in student and faculty views

### Events
- Department event creation and management
- Event image upload and MongoDB-backed storage
- Event display across HOD, faculty, and student dashboards

### Reporting
- Attendance reports
- Performance reports
- Assignment submission insights
- Student/faculty management views

## Tech Stack

### Backend
- Python
- FastAPI
- Supabase client
- PostgreSQL / Supabase database
- MongoDB Atlas + GridFS
- JWT authentication via python-jose
- Pydantic validation

### Frontend
- React
- Vite
- React Router
- CSS styling

## Project Structure

```text
Attendence-Product/
├── README.md
├── app.py
├── RUN_BACKEND.bat
├── add_leave_requests_table.sql
├── create_events_table.sql
├── database_schema.sql
├── DEBUGGING_LEAVE_REQUESTS.md
├── FIX_SUMMARY.md
├── LEAVE_REQUEST_FLOW.md
├── implementation_plan.md
├── implementation_plan2
├── backend/
│   ├── requirements.txt
│   ├── START_BACKEND.bat
│   ├── add_column_migration.py
│   ├── clean_students.py
│   ├── create_events_table.py
│   ├── create_test_users.py
│   ├── migrate_image_url.sql
│   ├── test_database.py
│   └── app/
│       ├── __init__.py
│       ├── app.py
│       ├── config.py
│       ├── database.py
│       ├── middleware/
│       │   ├── __init__.py
│       │   └── auth.py
│       ├── routes/
│       │   ├── __init__.py
│       │   ├── assignments.py
│       │   ├── auth.py
│       │   ├── faculty.py
│       │   ├── hod.py
│       │   ├── notifications.py
│       │   ├── projects.py
│       │   ├── settings.py
│       │   └── student.py
│       └── services/
│           └── event_storage.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── eslint.config.js
│   ├── README.md
│   ├── public/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── components/
│       │   ├── common.css
│       │   └── Sidebar/
│       │       ├── Sidebar.css
│       │       └── Sidebar.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.css
│       │   │   └── LoginPage.jsx
│       │   ├── faculty/
│       │   │   ├── AttendanceEntry.jsx
│       │   │   ├── FacultyAssignments.jsx
│       │   │   ├── FacultyAssignmentUpload.jsx
│       │   │   ├── FacultyDashboard.jsx
│       │   │   ├── FacultyEvents.jsx
│       │   │   ├── FacultyProjects.jsx
│       │   │   ├── FacultySubmissions.jsx
│       │   │   ├── LeaveRequest.jsx
│       │   │   ├── MarksEntry.jsx
│       │   │   └── StudentUpload.jsx
│       │   ├── hod/
│       │   │   ├── AttendanceView.jsx
│       │   │   ├── EventsManagement.jsx
│       │   │   ├── FacultyManagement.css
│       │   │   ├── FacultyManagement.jsx
│       │   │   ├── HODAssignments.jsx
│       │   │   ├── HODDashboard.css
│       │   │   ├── HODDashboard.jsx
│       │   │   ├── HODProjects.jsx
│       │   │   ├── LeaveApproval.jsx
│       │   │   └── StudentManagement.jsx
│       │   └── student/
│       │       ├── StudentAssignments.jsx
│       │       ├── StudentAttendance.jsx
│       │       ├── StudentDashboard.css
│       │       ├── StudentDashboard.jsx
│       │       ├── StudentEvents.jsx
│       │       ├── StudentMarks.jsx
│       │       ├── StudentProfile.jsx
│       │       ├── StudentProfileSetup.jsx
│       │       └── StudentProjects.jsx
│       └── services/
│           ├── api.js
│           └── minimalAPI.js
└── uploads/
```

## Database and Storage Setup

This project uses:
- Supabase/PostgreSQL for core application tables
- MongoDB Atlas GridFS for event image storage

Core SQL schema files included in the root:
- `database_schema.sql`
- `add_leave_requests_table.sql`
- `create_events_table.sql`

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- A Supabase project
- A MongoDB Atlas cluster for event image storage

## Backend Setup

1. Open a terminal in the project root.
2. Move into the backend folder:

```bash
cd backend
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Start the API server:

```bash
cd app
uvicorn app:app --reload
```

Alternative:

```bash
cd backend
python -m uvicorn app.app:app --reload
```

You can also use:

```bash
cd backend
START_BACKEND.bat
```

## Frontend Setup

1. Open a new terminal.
2. Go to the frontend folder:

```bash
cd frontend
```

3. Install dependencies:

```bash
npm install
```

4. Start the frontend app:

```bash
npm run dev
```

The frontend usually runs at:
- http://localhost:5173

The backend usually runs at:
- http://localhost:8000

## Environment Configuration

The application configuration is stored in:
- `backend/app/config.py`

This includes:
- Supabase connection settings
- JWT configuration
- MongoDB Atlas URI and bucket configuration
- backend base URL for image serving

## Running the Application

Open the frontend in the browser and log in using one of the role-based accounts configured in your Supabase data.

Typical app flow:
- HOD manages all department data
- Faculty handles classes and attendance
- Students view academic information and submit leave requests

## Notes

- Event images are stored in MongoDB Atlas GridFS instead of the local uploads folder.
- The API exposes event images through `/api/hod/event-images/{image_id}`.
- Several debugging and workflow notes are included in the project root for leave request and migration issues.

## Useful Project Docs

- `LEAVE_REQUEST_FLOW.md`
- `DEBUGGING_LEAVE_REQUESTS.md`
- `FIX_SUMMARY.md`
- `implementation_plan.md`
- `implementation_plan2`

## License

This project is currently developed for internal academic departmental use and may be customized further depending on deployment requirements.
