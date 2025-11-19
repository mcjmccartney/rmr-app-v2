-- Migration: Add booking terms version control
-- Run this against your Supabase/Postgres database

-- Create booking_terms_versions table
CREATE TABLE IF NOT EXISTS booking_terms_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number integer NOT NULL,
  title text NOT NULL,
  html_content text NOT NULL,
  is_active boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure version numbers are unique
  UNIQUE(version_number)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_booking_terms_versions_active ON booking_terms_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_booking_terms_versions_number ON booking_terms_versions(version_number);

-- Add version_id to booking_terms table to track which version was signed
ALTER TABLE booking_terms ADD COLUMN IF NOT EXISTS version_id uuid REFERENCES booking_terms_versions(id);

-- Add index for version lookups
CREATE INDEX IF NOT EXISTS idx_booking_terms_version_id ON booking_terms(version_id);

-- Insert the current booking terms as version 1 (active)
INSERT INTO booking_terms_versions (version_number, title, html_content, is_active)
VALUES (
  1,
  'Service Agreement v1',
  '<div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold mb-4" style="color: #4f6749;">1-1 Sessions</h2>
      <div class="space-y-4 text-sm leading-relaxed">
        <p>Please tell me if there is anything I should know before our session. If there is something that you yourself would want to know, then assume I would feel the same. If your dog has any medical conditions, allergies, intolerances or special requirements, please tell me before our session.</p>
        <p class="font-medium">If you, your dog, a person or animal in your household is unwell within 3 days before our session, you must inform me. If you have already paid for your session and a household member becomes unwell, I will carry the payment forward to your next booking.</p>
        <p>Please be open with me. If something does not feel comfortable please tell me straight away. If you do not feel physically capable of a suggestion I make, or if it does not feel safe for any reason, it is up to you to tell me.</p>
        <p>Equally, I reserve the right to leave if I feel uncomfortable with a situation or behaviour of any person involved in the session.</p>
        <p>As the owner of the dog, it is your responsibility to make sure your dog does not pose a threat to any other animals or people.</p>
        <p>All advice I give you must feel comfortable and safe for you, your dog, your family, your home and other people and animals. If it doesn''t, please tell me and we can discuss a different approach. The decision to follow advice or not lies with you.</p>
        <p>Remember, I only see a snapshot of your dog and can only base a professional opinion on that snapshot and/or the information you provide.</p>
      </div>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold mb-4" style="color: #4f6749;">Payments, Refunds & Cancellations</h2>
      <div class="space-y-4 text-sm leading-relaxed">
        <p>Payment is due on the day of your session and can be paid by payment link.</p>
        <p>Online Sessions are <strong>£50 for Dog Club Members,</strong> and <strong>£70 for non-members.</strong> In-person Sessions are <strong>£75 for Dog Club Members,</strong> and <strong>£95 for non-members.</strong> A travel fee may occasionally apply but would discussed before the session. Dog training/person coaching is priced per request.</p>
        <p>I do not offer refunds but exceptions may be made at my discretion.</p>
        <p>I understand life happens and cancellations may be necessary, but please be considerate:<br />1-2 week''s notice gives me chance to fill your session slot.</p>
        <p>After one reschedule with <strong>less than 7 days'' notice</strong>, I''ll need to take payment upfront for future bookings as my small business relies on sessions going ahead.</p>
      </div>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold mb-4" style="color: #4f6749;">Privacy</h2>
      <p class="text-sm leading-relaxed">Your personal details are stored in a password-protected cloud system. The identifying details you share about your dog are considered confidential unless I feel there is a welfare issue.</p>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold mb-4" style="color: #4f6749;">Disclaimer</h2>
      <div class="space-y-4 text-sm leading-relaxed">
        <p>Any work with animals inherently carries a risk of injury. By booking with me, you assume full responsibility for any risks, injuries or damages that may occur as a result of the session(s), and for having appropriate pet insurance for your dog.</p>
        <p>You, and any other voluntary attendees, are present for the session at your own risk.</p>
        <p>You understand and accept that your dog (and their behaviour) remains entirely your responsibility at all times, whether or not the presence of a behaviourist or trainer.</p>
      </div>
    </div>
  </div>',
  true
)
ON CONFLICT (version_number) DO NOTHING;

-- Add comment
COMMENT ON TABLE booking_terms_versions IS 'Stores different versions of booking terms with version control';
COMMENT ON COLUMN booking_terms_versions.is_active IS 'Only one version should be active at a time - this is what clients will sign';
COMMENT ON COLUMN booking_terms.version_id IS 'References which version of the terms was signed';

