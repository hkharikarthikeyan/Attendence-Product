# Attendance-Product

A comprehensive **Student Management System (SMS)** for managing student academic and departmental data efficiently.

## Features

### Role-Based Access Control
- **HOD (Head of Department)**: Manages faculty, students, events, and generates reports
- **Faculty**: Marks attendance, enters marks, views events
- **Student**: Views profile, attendance, marks, and events

### Functional Modules
- ✅ Authentication Module (JWT-based)
- ✅ Student Database Module
- ✅ HOD Management Module
- ✅ Faculty Module
- ✅ Attendance Management
- ✅ Marks & Percentage Module
- ✅ Events Management
- ✅ Class & Batch Management

## Tech Stack

### Backend
- **Python FastAPI** - High-performance API framework
- **Supabase** - PostgreSQL database with built-in auth

### Frontend
- **React + Vite** - Modern, fast development
- **React Router** - Client-side routing
- **CSS Variables** - Custom design system

## UI Theme
**Academic Admin Dashboard** - Professional, institutional design
- Primary: Navy Blue (`#1e3a5f`)
- Accent: Teal (`#14b8a6`)
- Typography: Inter / Poppins

## Project Structure

```
attedence/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI entry point
│       ├── config.py        # Environment config
│       ├── database.py      # Supabase client
│       ├── models/          # Pydantic models
│       ├── routers/         # API routes
│       └── middleware/      # Auth middleware
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main router
│   │   ├── index.css        # Design system
│   │   ├── context/         # Auth context
│   │   ├── services/        # API services
│   │   ├── components/      # Reusable components
│   │   └── pages/           # Role-based pages
│   │       ├── hod/         # HOD dashboard & management
│   │       ├── faculty/     # Faculty dashboard & entry
│   │       └── student/     # Student dashboard & views
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Set environment variables in .env
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Team
- **Hari**
- **Salman**

## License
MIT
