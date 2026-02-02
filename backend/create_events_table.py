#!/usr/bin/env python3
"""
Create missing events table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import supabase

def create_events_table():
    """Create events table"""
    
    sql = """
    CREATE TABLE IF NOT EXISTS public.events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        event_date TIMESTAMP WITH TIME ZONE NOT NULL,
        event_type TEXT NOT NULL CHECK (event_type IN ('academic', 'cultural', 'sports', 'other')),
        created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
    
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow all for service role" ON public.events FOR ALL USING (true);
    
    INSERT INTO public.events (title, description, event_date, event_type) VALUES
    ('Welcome Ceremony', 'New academic year welcome ceremony', NOW() + INTERVAL '7 days', 'academic'),
    ('Sports Day', 'Annual sports competition', NOW() + INTERVAL '14 days', 'sports'),
    ('Cultural Fest', 'Annual cultural festival', NOW() + INTERVAL '21 days', 'cultural')
    ON CONFLICT DO NOTHING;
    """
    
    try:
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("[OK] Events table created successfully")
        
        # Verify table exists
        events = supabase.table("events").select("*").limit(1).execute()
        print(f"[OK] Events table verified - {len(events.data)} sample events")
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        # Try alternative method
        try:
            print("Trying direct table creation...")
            supabase.table("events").insert({
                "title": "Test Event",
                "description": "Test",
                "event_date": "2024-12-31T10:00:00Z",
                "event_type": "academic"
            }).execute()
            print("[OK] Events table exists and working")
        except Exception as e2:
            print(f"[ERROR] Table creation failed: {str(e2)}")

if __name__ == "__main__":
    create_events_table()