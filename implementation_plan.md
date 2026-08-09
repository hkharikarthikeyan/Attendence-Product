# Implementation Plan - Student Management System (SMS)

This plan outlines the architecture, database schema, and implementation strategy for the complete Student Management System (SMS).

## User Review Required

> [!IMPORTANT]
> The database schema includes audit columns (`created_at`, `updated_at`, `deleted_at`) across all tables. Soft deletes will be supported where appropriate by filtering on `deleted_at IS NULL`.
> 
> A robust Role-Based Access Control (RBAC) is implemented using `roles` and user-role relations.

## Proposed Database Schema (Supabase PostgreSQL)

Here is the complete SQL schema mapping all 20 required tables:

1. `roles` - Defines user roles (hod, faculty, student).
2. `users` - Base accounts table with email, username, and password_hash.
3. `departments` - College departments (e.g., Computer Science).
4. `classes` - Class, section, and semester mappings.
5. `subjects` - Subjects mapping to departments/semesters.
6. `students` - Student profiles referencing users and classes.
7. `faculty` - Faculty profiles referencing users and departments.
8. `attendance` - Session-level attendance header.
9. `attendance_details` - Student-specific status in each attendance session.
10. `marks` - Internal, external, lab, and assignment marks.
11. `assignments` - Assignments created by faculty.
12. `assignment_submission` - Student submissions.
13. `projects` - Project definitions with faculty guides.
14. `project_team` - Student teams assigned to projects.
15. `events` - College/academic events.
16. `notifications` - In-app announcements/notifications.
17. `activity_logs` - User activity logs.
18. `settings` - Global and role-specific system settings.
19. `login_history` - Sessions and logins history.
20. `password_history` - History of hashed passwords for password reuse prevention.

## Next Steps and Phase Details

- **Phase 1: Architecture Validation** (Verify backend code structure, folders, configuration)
- **Phase 2: Database Setup** (Apply SQL schema to Supabase, verify constraints and indexes)
- **Phase 3: Authentication & Security** (JWT token flows, bcrypt hashing, password policies, force change on first login)
- **Phase 4: Role Management** (HOD, Faculty, Student authorization checks)

## Verification Plan

### Automated Tests
- Pytest for database models and relationships.

### Manual Verification
- Execute schema queries in Supabase SQL editor.
- Verify table creation, indexes, and constraints.
