-- Session Plans Database Schema
-- Add session plans and action points tables to your existing database

-- Create action_points table (predefined action points)
CREATE TABLE IF NOT EXISTS action_points (
    id VARCHAR(50) PRIMARY KEY, -- Using the IDs from your existing data
    header VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_plans table
CREATE TABLE IF NOT EXISTS session_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL, -- Auto-calculated based on client's session count
    main_goal_1 TEXT,
    main_goal_2 TEXT,
    main_goal_3 TEXT,
    main_goal_4 TEXT,
    explanation_of_behaviour TEXT,
    action_points TEXT[], -- Array of action point IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one session plan per session
    UNIQUE(session_id)
);

-- Add session_plan_id to sessions table (optional - for quick lookup)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_plan_id UUID REFERENCES session_plans(id);

-- Insert predefined action points
INSERT INTO action_points (id, header, details) VALUES
('dR2vCl8iTsGTaNOPx.sO-A', 'Consider Supplements', 'The Dorwest Scullcap & Valerian supplement can help dogs feel calm and focused. Try adding this to [Dog Name]''s daily routine.'),
('eGARTzfTS9SXyAkSN2OTpg', 'Help {{Dog}} Calm {{Self}} Down', 'Sniffing, licking and chewing all release soothing hormones in a dog''s brain. Try and encourage [Dog Name] to do these activities when [he/she] is feeling overwhelmed.'),
('QSzLfZlbTZyfTZ2YRFPPCQ', 'Teach a Flight Cue', 'Flight cues are amazing - they show your dog there is another option to ''fight'' and it creates a positive association with moving away from triggers.'),
('NsOc1zRATcWfNgOT588Zqg', 'Learn Sniffy Games', 'Start off teaching [Dog Name] some sniffy games with a cue word so [he/she] understands what you''re asking for when you need [him/her] to sniff.'),
('F9g-sQqBRplDkmFkrF3C-w', 'Consider Diet', 'A switch in [Dog Name]''s diet could make a big change. I would consider looking at a high quality, single protein diet with no additives.'),
('tc-CDlletfG9tE0QlSE2.Q', '3-Step Interruption Process', 'Simply interrupting a behaviour can help, but if you make it a 3-step process it should work much better and be less confrontational.'),
('HnDvny7QTC6R2HUyitw6Tg', 'Increase {{Dog}}''s Exercise', 'Exercise could mean actual walking time, sniffing time, or simply giving [him/her] new places to explore. Mental stimulation is just as tiring as physical exercise.'),
('w8lDTQ8gQt203W3gBXWZzw', 'Play Sniffy Games & Brain Games', 'Play treasure hunt games and sniffy games to help add enrichment to daily life. Add a word or cue to these games so you can redirect [Dog Name] when needed.'),
('CSozTocJTHOlQyk9wgMZBw', 'Show {{Dog}} You Hear {{Him}}', 'By closely watching body language, you can show [Dog Name] that [he/she] doesn''t need to escalate behaviours to get your attention.'),
('ybEp-4HqSE2lBxFMnhYMLw', 'Keep {{Dog}} Below Threshold', 'This is the most important thing - make sure there is no point during training in which [Dog Name] goes over threshold and becomes reactive.'),
('clzLvJpEQLlHQZ6nTfe.w', 'Keep Calm When Leaving', 'Whenever you leave the house, make it as calm and non-eventful as possible. Same as when you return - keep greetings calm and brief.'),
('wZ6HTuA8R2QllArV5APMlQ', 'Practice for Real-Life Situations', 'Practice your process lots, so you feel confident when the real situation arises. This is ideal to do when [Dog Name] is calm and focused.'),
('a-lXQLQosTGKChGORuNe.vw', 'Think About Trigger Stacking', 'Use the Trigger Stacking Guide from the Dog Club - this helps to show how [Dog Name]''s triggers can build up throughout the day.'),
('oSqelwMQy5plD.ltloAA', 'Remember the ABC of Behaviour', 'Antecedent: What happened before the behaviour? Behaviour: What did [Dog Name] do? Consequence: What happened after the behaviour?'),
('mYhKZnloRlmFbu3kAYCtow', 'Long Lines or Retractable Leads', 'A retractable lead or long line will mean [Dog Name] gets more exercise per walk as [he/she] can explore more and make more choices.'),
('sBePvr6JTH6zybLUymvpnQ', 'Create Toileting Structure', 'Consistent and regular walks will help show [Dog Name] [he/she] has plenty of opportunities to toilet outside, reducing accidents indoors.'),
('aTQ.9bBfSeSuQNaVqbFR5w', 'Keep Playing ''Touch''', 'Touch is great for lots of things, including redirecting behaviour, recall and guiding them through situations they find difficult.'),
('FSLTl8VETe-PuACfmZP3vg', 'Build Patience in Tiny Doses', 'Patience is a wonderful skill to have. Build it up in small doses, being sure to get ahead of [Dog Name] and reward before [he/she] gets frustrated.')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_plans_session_id ON session_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_created_at ON session_plans(created_at);

-- Function to calculate session number for a client
CREATE OR REPLACE FUNCTION calculate_session_number(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
    client_id_var UUID;
    session_date_var DATE;
    session_number_var INTEGER;
BEGIN
    -- Get the client_id and booking_date for the given session
    SELECT s.client_id, s.booking_date::DATE 
    INTO client_id_var, session_date_var
    FROM sessions s 
    WHERE s.id = p_session_id;
    
    -- Count sessions for this client up to and including this session date
    SELECT COUNT(*) 
    INTO session_number_var
    FROM sessions s
    WHERE s.client_id = client_id_var 
    AND s.booking_date::DATE <= session_date_var
    ORDER BY s.booking_date, s.booking_time;
    
    RETURN session_number_var;
END;
$$ LANGUAGE plpgsql;
