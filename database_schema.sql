-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ROLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    first_login BOOLEAN DEFAULT TRUE,
    password_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '90 days',
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ==========================================
-- 2.5 HOD
-- ==========================================
CREATE TABLE IF NOT EXISTS public.hod (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    mobile VARCHAR(20),
    department VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_hod_employee_id ON public.hod(employee_id);

-- ==========================================
-- 3. DEPARTMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 4. CLASSES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(department_id, academic_year, semester, section)
);

-- ==========================================
-- 5. SUBJECTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 6. FACULTY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20),
    department VARCHAR(150),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    availability_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_faculty_employee_id ON public.faculty(employee_id);

-- ==========================================
-- 6.5 CLASS ADVISORS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.class_advisor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    class_year VARCHAR(50) NOT NULL,
    section VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(faculty_id, class_year, section),
    UNIQUE(class_year, section)
);

CREATE INDEX IF NOT EXISTS idx_class_advisor_faculty ON public.class_advisor_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_class_advisor_class ON public.class_advisor_assignments(class_year, section);

-- ==========================================
-- 7. STUDENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    class_year VARCHAR(50),
    section VARCHAR(20),
    batch VARCHAR(50),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    mobile VARCHAR(20),
    father_name VARCHAR(150),
    mother_name VARCHAR(150),
    profile_photo TEXT,
    approval_status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_register ON public.students(register_number);

-- ==========================================
-- 8. ATTENDANCE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    class_year VARCHAR(50),
    section VARCHAR(20),
    subject VARCHAR(150),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'od')),
    period INT DEFAULT 1,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- ==========================================
-- 9. ATTENDANCE DETAILS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.attendance_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'od')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(attendance_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_details_student ON public.attendance_details(student_id);

-- ==========================================
-- 10. MARKS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject VARCHAR(150),
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('internal1', 'internal2', 'internal3', 'external', 'lab', 'assignment')),
    max_marks NUMERIC(5, 2) NOT NULL,
    marks_obtained NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, subject_id, exam_type)
);

-- ==========================================
-- 11. ASSIGNMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject VARCHAR(150),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE SET NULL,
    class_year VARCHAR(50) NOT NULL,
    section VARCHAR(20) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 12. ASSIGNMENT SUBMISSION
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assignment_submission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_url TEXT,
    marks_obtained NUMERIC(5, 2),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'evaluated', 'late')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(assignment_id, student_id)
);

-- ==========================================
-- 13. PROJECTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 14. PROJECT TEAMS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    is_lead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, student_id)
);

ALTER TABLE public.project_team ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT FALSE;

-- ==========================================
-- 14.5 PROJECT PROGRESS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    phase_1_mark NUMERIC(5,2) DEFAULT 0,
    phase_2_mark NUMERIC(5,2) DEFAULT 0,
    phase_3_mark NUMERIC(5,2) DEFAULT 0,
    current_phase VARCHAR(20) DEFAULT 'phase_1',
    completion_percentage INT DEFAULT 0,
    faculty_status VARCHAR(30) DEFAULT 'pending' CHECK (faculty_status IN ('pending', 'approved', 'rejected')),
    hod_status VARCHAR(30) DEFAULT 'pending' CHECK (hod_status IN ('pending', 'approved', 'rejected')),
    faculty_comment TEXT,
    hod_comment TEXT,
    team_lead_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    faculty_phase_1_status VARCHAR(30) DEFAULT 'pending',
    faculty_phase_1_comment TEXT,
    faculty_phase_2_status VARCHAR(30) DEFAULT 'pending',
    faculty_phase_2_comment TEXT,
    faculty_phase_3_status VARCHAR(30) DEFAULT 'pending',
    faculty_phase_3_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS team_lead_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS faculty_phase_1_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS faculty_phase_1_comment TEXT;
ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS faculty_phase_2_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS faculty_phase_2_comment TEXT;
ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS faculty_phase_3_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE public.project_progress ADD COLUMN IF NOT EXISTS faculty_phase_3_comment TEXT;

-- ==========================================
-- 15. EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('academic', 'cultural', 'sports', 'other')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 16. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 17. ACTIVITY LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 18. SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 19. LOGIN HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- ==========================================
-- 20. PASSWORD HISTORY
-- ==========================================
CREATE TABLE IF NOT EXISTS public.password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 21. LEAVE REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('faculty', 'student')),
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('od', 'medical', 'personal', 'permission', 'casual', 'sick')),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_faculty', 'pending_hod', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- ==========================================
-- RLS CONFIGURATION
-- ==========================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_advisor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hod ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies
CREATE POLICY "Allow all for service role" ON public.roles FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.departments FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.classes FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.subjects FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.faculty FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.class_advisor_assignments FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.attendance_details FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.marks FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.assignments FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.assignment_submission FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.project_team FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.project_progress FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.settings FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.login_history FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.password_history FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.leave_requests FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.hod FOR ALL USING (true);

-- Insert Roles
INSERT INTO public.roles (name, description) VALUES
('hod', 'Head of Department - System Controller'),
('faculty', 'Faculty Member - Academic and Attendance Administrator'),
('student', 'Student - Portal View and Assignment Submission')
ON CONFLICT (name) DO NOTHING;

-- Seed HOD User (Email: Hod@mahendra.edu, Password: Hod@1212)
DO $$
DECLARE
    v_role_id UUID;
    v_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Get HOD role ID
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'hod';
    
    -- Insert HOD user record
    INSERT INTO public.users (id, email, username, password_hash, role_id, first_login)
    VALUES (
        v_user_id,
        'Hod@mahendra.edu',
        'hod_admin',
        '$2b$12$O23x67BPrOQ.4FoS0mSng.Dn9mAbk9F1P9pb10/Ig3a4AMgAsx.bC',
        v_role_id,
        FALSE
    )
    ON CONFLICT (email) DO NOTHING;

    -- Insert HOD profile
    INSERT INTO public.hod (id, name, employee_id, department)
    VALUES (
        v_user_id,
        'Dr. Mahendra Admin',
        'HOD001',
        'Computer Science'
    )
    ON CONFLICT (id) DO NOTHING;
END $$;
