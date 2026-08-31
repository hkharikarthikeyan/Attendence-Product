-- Migration: Add per-phase faculty review columns to project_progress
-- Run this on your Supabase database

ALTER TABLE public.project_progress
    ADD COLUMN IF NOT EXISTS faculty_phase_1_status VARCHAR(30) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS faculty_phase_1_comment TEXT,
    ADD COLUMN IF NOT EXISTS faculty_phase_2_status VARCHAR(30) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS faculty_phase_2_comment TEXT,
    ADD COLUMN IF NOT EXISTS faculty_phase_3_status VARCHAR(30) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS faculty_phase_3_comment TEXT;
