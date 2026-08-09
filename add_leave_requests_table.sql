-- ============================================================
-- Add Leave Requests Table
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('faculty', 'student')),
    leave_type TEXT NOT NULL CHECK (leave_type IN ('od', 'medical', 'personal', 'permission', 'casual', 'sick')),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_role ON public.leave_requests(role);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(from_date, to_date);

-- Enable Row Level Security
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for service role)
CREATE POLICY "Allow all for service role" ON public.leave_requests FOR ALL USING (true);

-- Verification query
SELECT 'Leave requests table created successfully!' AS message;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;
