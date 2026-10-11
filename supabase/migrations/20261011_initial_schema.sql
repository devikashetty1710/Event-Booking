-- ====================================================================
-- NITTE CAMPUSCONNECT: DATABASE SCHEMA & CONCURRENCY TRANSACTION RPCs
-- Institution: NMAM Institute of Technology (NMAMIT), Nitte
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Enumerated Types
CREATE TYPE user_role_type AS ENUM ('user', 'admin', 'venue_manager');
CREATE TYPE venue_block_type AS ENUM (
  'APJ Kalam Block',
  'Ramanujan Block',
  'Academic Administration Block',
  'Innovation and Research Block',
  'Central Campus'
);
CREATE TYPE venue_category_type AS ENUM (
  'Auditorium',
  'Seminar Hall',
  'Conference Room',
  'Boardroom',
  'Lab',
  'Open-Air Facility'
);
CREATE TYPE booking_status_type AS ENUM (
  'Draft',
  'Pending Approval',
  'Under Review',
  'Approved',
  'Rejected',
  'Cancelled',
  'Completed'
);
CREATE TYPE event_category_type AS ENUM (
  'seminar',
  'workshop',
  'conference',
  'club_activity',
  'cultural_event',
  'technical_event',
  'meeting',
  'guest_lecture',
  'other'
);
CREATE TYPE event_visibility_type AS ENUM ('public', 'campus_only', 'private_invited');

-- 3. Profiles Table (Coupled with auth.users if Supabase Auth is enabled)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role_type NOT NULL DEFAULT 'user',
  department TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint for official institutional email domain
ALTER TABLE profiles ADD CONSTRAINT institutional_email_domain_check
CHECK (email LIKE '%@nmamit.in' OR email LIKE '%@nitte.in');

-- 4. Venues Table
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  block venue_block_type NOT NULL,
  venue_type venue_category_type NOT NULL,
  description TEXT NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 10,
  max_capacity INTEGER NOT NULL,
  recommended_capacity INTEGER NOT NULL,
  facilities TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  operating_start TIME NOT NULL DEFAULT '08:00:00',
  operating_end TIME NOT NULL DEFAULT '20:00:00',
  accessibility_features TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_status TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'under_maintenance', 'temporarily_closed'
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo_venue BOOLEAN NOT NULL DEFAULT FALSE,
  location_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  organizer_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  organizer_name TEXT NOT NULL,
  organizer_email TEXT NOT NULL,
  organizer_phone TEXT,
  department TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_category event_category_type NOT NULL,
  expected_attendees INTEGER NOT NULL,
  visibility event_visibility_type NOT NULL DEFAULT 'campus_only',
  
  requested_venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  assigned_venue_id TEXT REFERENCES venues(id) ON DELETE RESTRICT,
  
  requested_date DATE NOT NULL,
  requested_start TIME NOT NULL,
  requested_end TIME NOT NULL,
  setup_start TIME,
  cleanup_end TIME,
  
  additional_notes TEXT,
  status booking_status_type NOT NULL DEFAULT 'Pending Approval',
  review_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  
  qr_check_in_token TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Booking Equipment Junction Table
CREATE TABLE IF NOT EXISTS booking_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Venue Maintenance Blocks Table
CREATE TABLE IF NOT EXISTS venue_blocks (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  venue_name TEXT,
  blocked_start TIMESTAMPTZ NOT NULL,
  blocked_end TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Booking Audit History Table
CREATE TABLE IF NOT EXISTS booking_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status booking_status_type NOT NULL,
  new_status booking_status_type NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_by_name TEXT NOT NULL,
  comments TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES FOR CALENDAR RANGE & AVAILABILITY QUERIES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(requested_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_date ON bookings(assigned_venue_id, requested_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_organizer ON bookings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_history_booking ON booking_history(booking_id);

-- ====================================================================
-- TRANSACTIONAL CONCURRENCY RPC: SAFE BOOKING APPROVAL
-- Prevents overlapping reservations even under simultaneous submissions
-- ====================================================================

CREATE OR REPLACE FUNCTION approve_booking_transactional(
  p_booking_id TEXT,
  p_assigned_venue_id TEXT,
  p_reviewer_id UUID,
  p_reviewer_name TEXT,
  p_review_notes TEXT DEFAULT 'Approved by Campus Facilities Administration.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_conflict_count INTEGER;
  v_venue venues%ROWTYPE;
  v_token TEXT;
BEGIN
  -- 1. Fetch and Lock the Booking Row for update
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking request not found.');
  END IF;

  -- 2. Fetch and Lock Venue Row to serialize concurrent approvals on the same venue
  SELECT * INTO v_venue
  FROM venues
  WHERE id = p_assigned_venue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target venue does not exist.');
  END IF;

  IF v_venue.maintenance_status <> 'normal' OR NOT v_venue.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Venue is currently closed or under maintenance.');
  END IF;

  -- 3. Check for Overlapping Approved or Under-Review Bookings
  -- Overlap condition: max(startA, startB) < min(endA, endB)
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE (assigned_venue_id = p_assigned_venue_id OR (assigned_venue_id IS NULL AND requested_venue_id = p_assigned_venue_id))
    AND requested_date = v_booking.requested_date
    AND status = 'Approved'
    AND id <> p_booking_id
    AND (
      (COALESCE(setup_start, requested_start), COALESCE(cleanup_end, requested_end))
      OVERLAPS
      (COALESCE(v_booking.setup_start, v_booking.requested_start), COALESCE(v_booking.cleanup_end, v_booking.requested_end))
    );

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Concurrency conflict: This venue was already reserved by another confirmed event during this slot.'
    );
  END IF;

  -- 4. Check for Maintenance Blocks
  SELECT COUNT(*) INTO v_conflict_count
  FROM venue_blocks
  WHERE venue_id = p_assigned_venue_id
    AND DATE(blocked_start AT TIME ZONE 'Asia/Kolkata') = v_booking.requested_date;

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Venue is blocked for scheduled technical maintenance on this date.'
    );
  END IF;

  -- 5. Generate Opaque QR Token
  v_token := 'TOKEN_' || SUBSTRING(p_booking_id FROM 1 FOR 8) || '_' || MD5(RANDOM()::TEXT);

  -- 6. Apply Approval
  UPDATE bookings
  SET status = 'Approved',
      assigned_venue_id = p_assigned_venue_id,
      review_notes = p_review_notes,
      reviewed_by = p_reviewer_id,
      reviewed_by_name = p_reviewer_name,
      reviewed_at = NOW(),
      qr_check_in_token = v_token,
      updated_at = NOW()
  WHERE id = p_booking_id;

  -- 7. Insert Audit Record
  INSERT INTO booking_history (
    id, booking_id, previous_status, new_status, changed_by, changed_by_name, comments, created_at
  ) VALUES (
    'hist-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    p_booking_id,
    v_booking.status,
    'Approved',
    p_reviewer_id,
    p_reviewer_name,
    p_review_notes,
    NOW()
  );

  -- 8. Insert In-App Notification
  INSERT INTO notifications (
    id, user_id, booking_id, title, message, type, is_read, created_at
  ) VALUES (
    'notif-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    v_booking.organizer_id::TEXT,
    p_booking_id,
    'Booking Approved: ' || v_booking.event_title,
    'Your venue reservation for ' || v_venue.name || ' on ' || v_booking.requested_date || ' has been approved.',
    'success',
    FALSE,
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'reference_code', v_booking.reference_code);
END;
$$;

-- ====================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Venues: Everyone can read active venues; Only admins can insert/update
CREATE POLICY "Venues viewable by all authenticated users"
ON venues FOR SELECT USING (true);

CREATE POLICY "Venues manageable only by admins"
ON venues FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Bookings: Public can see Approved non-private bookings; Organizers can see own bookings; Admins can see all
CREATE POLICY "Approved bookings viewable on campus calendar"
ON bookings FOR SELECT USING (
  status = 'Approved' AND visibility <> 'private_invited'
  OR organizer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Organizers can insert bookings"
ON bookings FOR INSERT WITH CHECK (
  organizer_id = auth.uid()
);

CREATE POLICY "Admins or owners can update bookings"
ON bookings FOR UPDATE USING (
  organizer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Notifications: Users only see their own notifications
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT USING (
  user_id = auth.uid()::TEXT OR user_id = 'all'
);

CREATE POLICY "Users can update their notifications"
ON notifications FOR UPDATE USING (
  user_id = auth.uid()::TEXT
);
