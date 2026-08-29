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
