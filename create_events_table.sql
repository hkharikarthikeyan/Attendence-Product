-- Create events table
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

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for service role" ON public.events FOR ALL USING (true);

-- Insert sample events
INSERT INTO public.events (title, description, event_date, event_type) VALUES
('Welcome Ceremony', 'New academic year welcome ceremony for all students', NOW() + INTERVAL '7 days', 'academic'),
('Sports Day', 'Annual inter-department sports competition', NOW() + INTERVAL '14 days', 'sports'),
('Cultural Fest', 'Annual cultural festival with performances', NOW() + INTERVAL '21 days', 'cultural'),
('Tech Symposium', 'Technical paper presentation and project showcase', NOW() + INTERVAL '30 days', 'academic'),
('Alumni Meet', 'Annual alumni gathering and networking event', NOW() + INTERVAL '45 days', 'other')
ON CONFLICT DO NOTHING;