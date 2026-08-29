import sys
import os
# Add current directory to path to find 'app'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# pyrefly: ignore [missing-import]
from app.database import supabase

def run_migration():
    sql = """
    ALTER TABLE public.students
        ADD COLUMN IF NOT EXISTS class_year VARCHAR(50),
        ADD COLUMN IF NOT EXISTS section VARCHAR(20),
        ADD COLUMN IF NOT EXISTS batch VARCHAR(50),
        ADD COLUMN IF NOT EXISTS profile_photo TEXT,
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending';

    ALTER TABLE public.faculty
        ADD COLUMN IF NOT EXISTS department VARCHAR(150),
        ADD COLUMN IF NOT EXISTS availability_status BOOLEAN DEFAULT TRUE;

    ALTER TABLE public.attendance
        ADD COLUMN IF NOT EXISTS student_id UUID,
        ADD COLUMN IF NOT EXISTS class_year VARCHAR(50),
        ADD COLUMN IF NOT EXISTS section VARCHAR(20),
        ADD COLUMN IF NOT EXISTS subject VARCHAR(150),
        ADD COLUMN IF NOT EXISTS status VARCHAR(20),
        ADD COLUMN IF NOT EXISTS period INT DEFAULT 1;

    ALTER TABLE public.attendance
        ALTER COLUMN class_id DROP NOT NULL,
        ALTER COLUMN subject_id DROP NOT NULL,
        ALTER COLUMN period DROP NOT NULL;

    ALTER TABLE public.events
        ADD COLUMN IF NOT EXISTS image_url TEXT;

    ALTER TABLE public.marks
        ADD COLUMN IF NOT EXISTS subject VARCHAR(150);

    ALTER TABLE public.marks
        ALTER COLUMN subject_id DROP NOT NULL;

    ALTER TABLE public.assignments
        ADD COLUMN IF NOT EXISTS class_year VARCHAR(50),
        ADD COLUMN IF NOT EXISTS section VARCHAR(20);

    ALTER TABLE public.assignments
        ADD COLUMN IF NOT EXISTS subject VARCHAR(150),
        ALTER COLUMN subject_id DROP NOT NULL;

    INSERT INTO public.subjects (code, name, department_id, semester)
    SELECT LEFT(d.code, 14) || '-MATH', 'Mathematics', d.id, 1
    FROM public.departments d
    WHERE NOT EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.department_id = d.id AND LOWER(s.name) = 'mathematics'
    )
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.subjects (code, name, department_id, semester)
    SELECT LEFT(d.code, 14) || '-PHYS', 'Physics', d.id, 1
    FROM public.departments d
    WHERE NOT EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.department_id = d.id AND LOWER(s.name) = 'physics'
    )
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.subjects (code, name, department_id, semester)
    SELECT LEFT(d.code, 14) || '-CHEM', 'Chemistry', d.id, 1
    FROM public.departments d
    WHERE NOT EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.department_id = d.id AND LOWER(s.name) = 'chemistry'
    )
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.subjects (code, name, department_id, semester)
    SELECT LEFT(d.code, 14) || '-CS', 'Computer Science', d.id, 1
    FROM public.departments d
    WHERE NOT EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.department_id = d.id AND LOWER(s.name) = 'computer science'
    )
    ON CONFLICT (code) DO NOTHING;
    """
    try:
        supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("Migration successful: faculty, student profile, attendance and event columns ensured.")
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    run_migration()
