-- Create the calculate_session_number database function
-- This is optional - the JavaScript version should work fine

-- Drop the function if it exists
DROP FUNCTION IF EXISTS calculate_session_number(uuid);

-- Create the function
CREATE OR REPLACE FUNCTION calculate_session_number(p_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    client_id_var uuid;
    session_number_var integer;
BEGIN
    -- Get the client_id for the given session
    SELECT client_id INTO client_id_var
    FROM sessions
    WHERE id = p_session_id;
    
    -- If session not found, return 1
    IF client_id_var IS NULL THEN
        RETURN 1;
    END IF;
    
    -- Calculate the session number by counting sessions for this client
    -- that are chronologically before or equal to this session
    SELECT COUNT(*) INTO session_number_var
    FROM sessions s1
    WHERE s1.client_id = client_id_var
    AND (
        s1.booking_date < (SELECT booking_date FROM sessions WHERE id = p_session_id)
        OR (
            s1.booking_date = (SELECT booking_date FROM sessions WHERE id = p_session_id)
            AND s1.booking_time <= (SELECT booking_time FROM sessions WHERE id = p_session_id)
        )
    );
    
    -- Return the calculated session number (minimum 1)
    RETURN GREATEST(session_number_var, 1);
END;
$$;

-- Test the function (replace with actual session ID)
-- SELECT calculate_session_number('your-session-id-here');

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_session_number(uuid) TO authenticated;

-- Example usage:
-- SELECT 
--   s.id,
--   s.client_id,
--   s.booking_date,
--   s.booking_time,
--   calculate_session_number(s.id) as session_number
-- FROM sessions s
-- ORDER BY s.client_id, s.booking_date, s.booking_time;
