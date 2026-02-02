-- ============================================================
-- Attendance Product - Database Schema
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE (for authentication)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('hod', 'faculty', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. HOD TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hod (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    mobile TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. FACULTY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    mobile TEXT,
    department TEXT,
    availability_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. STUDENTS TABLE (THIS IS THE MISSING TABLE!)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    register_number TEXT UNIQUE NOT NULL,
    roll_number TEXT NOT NULL,
    class_year TEXT NOT NULL,
    section TEXT NOT NULL,
    batch TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    father_name TEXT,
    mother_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_class_section ON public.students(class_year, section);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);
CREATE INDEX IF NOT EXISTS idx_students_register ON public.students(register_number);

-- ============================================================
-- 5. CLASSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_year TEXT NOT NULL,
    section TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_year, section, subject)
);

-- ============================================================
-- 6. FACULTY_CLASSES TABLE (Assignment)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faculty_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faculty_id, class_id)
);

-- ============================================================
-- 7. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    class_year TEXT NOT NULL,
    section TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject, date)
);

-- Create indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON public.attendance(class_year, section);

-- ============================================================
-- 8. MARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    class_year TEXT NOT NULL,
    section TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('internal1', 'internal2', 'internal3', 'external')),
    max_marks NUMERIC NOT NULL,
    marks_obtained NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject, exam_type)
);

-- Create indexes for marks queries
CREATE INDEX IF NOT EXISTS idx_marks_student ON public.marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class ON public.marks(class_year, section);

-- ============================================================
-- 9. EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('academic', 'cultural', 'sports', 'other')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for events
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hod ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (Allow service role to bypass RLS)
-- ============================================================

-- For now, allow all operations (you can customize these later)
CREATE POLICY "Allow all for service role" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.hod FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.faculty FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.classes FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.faculty_classes FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.marks FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.events FOR ALL USING (true);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Insert sample HOD user (password: hod123)
INSERT INTO public.users (id, email, password_hash, role) 
VALUES ('11111111-1111-1111-1111-111111111111', 'hod@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq', 'hod')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.hod (id, name, employee_id, department)
VALUES ('11111111-1111-1111-1111-111111111111', 'Dr. John Smith', 'HOD001', 'Computer Science')
ON CONFLICT (id) DO NOTHING;

-- Insert sample Faculty user (password: faculty123)
INSERT INTO public.users (id, email, password_hash, role)
VALUES ('22222222-2222-2222-2222-222222222222', 'faculty@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq', 'faculty')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.faculty (id, name, employee_id, department)
VALUES ('22222222-2222-2222-2222-222222222222', 'Prof. Jane Doe', 'FAC001', 'Computer Science')
ON CONFLICT (id) DO NOTHING;

-- Insert sample Student user (password: student123)
INSERT INTO public.users (id, email, password_hash, role)
VALUES ('33333333-3333-3333-3333-333333333333', 'student@college.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq', 'student')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.students (id, name, register_number, roll_number, class_year, section, batch, mobile, email)
VALUES ('33333333-3333-3333-3333-333333333333', 'Alex Johnson', 'REG2024001', '01', '3rd Year', 'A', '2022-2026', '9876543210', 'student@college.edu')
ON CONFLICT (register_number) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if all tables are created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check students table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
SELECT 'Database schema created successfully! You can now upload students.' AS message;
