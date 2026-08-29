-- SQL migration to add image_url to events table
-- Run this in your Supabase SQL Editor:

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;
