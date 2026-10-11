-- ====================================================================
-- NITTE CAMPUSCONNECT: DEMO SEED DATA
-- NMAM Institute of Technology (NMAMIT), Nitte
-- ====================================================================

-- 1. Seed Real NMAMIT Venues & Demonstrations
INSERT INTO venues (
  id, name, block, venue_type, description, min_capacity, max_capacity, recommended_capacity,
  facilities, equipment, operating_start, operating_end, accessibility_features,
  image_url, is_active, maintenance_status, approval_required, is_demo_venue, location_notes
) VALUES
-- 1. REAL NMAMIT VENUE
(
  'venue-nandini',
  'Nandini Seminar Hall',
  'APJ Kalam Block',
  'Seminar Hall',
  'Premier seminar hall located on the 2nd floor of APJ Kalam Block, equipped with tier seating, dual air-conditioning, smart motorized projector screen, and high-fidelity PA system.',
  50, 100, 80,
  ARRAY['Tiered Theater Seating', 'Air Conditioned', 'Power Backup', 'Smart Lectern', 'Acoustic Wall Panels'],
  ARRAY['Projector and display screen', 'Wireless microphone', 'Wired microphone', 'Speakers and sound system', 'Air conditioning', 'Wi-Fi', 'Podium'],
  '08:00:00', '20:00:00',
  ARRAY['Elevator Access in Block', 'Wheelchair Ramp to Stage', 'Designated Front Seating'],
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, FALSE, 'APJ Kalam Block, 2nd Floor, Room K-204'
),
-- 2. REAL NMAMIT VENUE
(
  'venue-shambavi',
  'Shambavi Seminar Hall',
  'APJ Kalam Block',
  'Seminar Hall',
  'High-capacity seminar auditorium in APJ Kalam Block featuring dual HD laser projectors, video-conferencing bridge, professional stage lighting, and full acoustic treatment.',
  100, 200, 160,
  ARRAY['Stepped Seating', 'Dual Split AC Units', 'VIP Green Room', 'Live Streaming Station', 'AV Control Booth'],
  ARRAY['Projector and display screen', 'Wireless microphone', 'Wired microphone', 'Speakers and sound system', 'Air conditioning', 'Video conferencing equipment', 'Wi-Fi', 'Podium', 'Recording equipment'],
  '08:00:00', '21:00:00',
  ARRAY['Elevator Access', 'Wide Double Doors', 'Hearing Loop System'],
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, FALSE, 'APJ Kalam Block, Ground Floor, East Wing'
),
-- 3. REAL NMAMIT VENUE
(
  'venue-sambhram',
  'Sambhram Hall',
  'Ramanujan Block',
  'Auditorium',
  'The flagship central auditorium of NMAMIT. Features grand proscenium stage, digital line-array sound system, motorized theatrical lights, VIP lounge, and expansive capacity for mega conventions and fests.',
  200, 500, 450,
  ARRAY['Grand Proscenium Stage', 'Central HVAC Air Conditioning', 'Green Rooms', 'VIP Lounges', 'Balcony Seating', 'Professional AV Booth'],
  ARRAY['Projector and display screen', 'Wireless microphone', 'Wired microphone', 'Speakers and sound system', 'Air conditioning', 'Video conferencing equipment', 'Wi-Fi', 'Podium', 'Recording equipment'],
  '08:00:00', '22:00:00',
  ARRAY['Ground-level Wheelchair Access', 'Ramp to Main Stage', 'Accessible Restrooms'],
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, FALSE, 'Ramanujan Block, Central Quadrangle Entrance'
),
-- 4. REAL NMAMIT VENUE
(
  'venue-phalguni',
  'Phalguni Hall',
  'Ramanujan Block',
  'Seminar Hall',
  'Compact, modern hall in Ramanujan Block tailored for interactive department symposiums, student presentations, workshops, and guest lectures with interactive display.',
  50, 80, 65,
  ARRAY['Cushioned Seating', 'Quiet Acoustic Isolation', 'Presenter Touch Console', 'Air Conditioning'],
  ARRAY['Projector and display screen', 'Wireless microphone', 'Speakers and sound system', 'Air conditioning', 'Whiteboard', 'Wi-Fi', 'Podium'],
  '08:30:00', '19:30:00',
  ARRAY['Elevator Access', 'Wide Aisles'],
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, FALSE, 'Ramanujan Block, 1st Floor, Room R-108'
),
-- 5. ADDITIONAL DEMO VENUE
(
  'venue-conf-a',
  'Conference Room A',
  'Academic Administration Block',
  'Conference Room',
  '[Demonstration Venue] Executive conference facility featuring an oval boardroom table, dual 4K monitors, and all-in-one conferencing bar for administrative meetings.',
  8, 20, 18,
  ARRAY['Executive Swivel Chairs', 'Center Audio Pick-Up', 'Integrated Cable Troughs', 'Whiteboard Wall'],
  ARRAY['Projector and display screen', 'Video conferencing equipment', 'Air conditioning', 'Whiteboard', 'Wi-Fi'],
  '09:00:00', '18:00:00',
  ARRAY['Level Access', 'Elevator Access'],
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, TRUE, 'Administration Block, Level 3, Executive Suite'
),
-- 6. ADDITIONAL DEMO VENUE
(
  'venue-innov-lab',
  'Innovation Lab',
  'Innovation and Research Block',
  'Lab',
  '[Demonstration Venue] Collaborative design sprint and hackathon space with movable wheeled tables, interactive smart boards, and maker equipment.',
  15, 40, 35,
  ARRAY['Modular Wheeled Desks', 'High Density Gigabit LAN', 'Dry Erase Glass Walls'],
  ARRAY['Projector and display screen', 'Whiteboard', 'Wi-Fi', 'Air conditioning'],
  '08:00:00', '22:00:00',
  ARRAY['Ground Floor Level Entry', 'Wide Wheelchair Pathways'],
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, TRUE, 'Innovation Block, Ground Floor Lab 02'
),
-- 7. ADDITIONAL DEMO VENUE
(
  'venue-amphi',
  'Open-Air Amphitheatre',
  'Central Campus',
  'Open-Air Facility',
  '[Demonstration Venue] Scenic semicircular outdoor amphitheatre surrounded by greenery, ideal for street plays, music recitals, student forums, and cultural evenings.',
  50, 300, 250,
  ARRAY['Tiered Granite Seating', 'Raised Circular Stage', 'Evening Architectural Lighting'],
  ARRAY['Wireless microphone', 'Speakers and sound system', 'Podium'],
  '16:00:00', '21:30:00',
  ARRAY['Ramped Access to Lower Ring'],
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, TRUE, 'Central Campus Lawn, Beside Food Court'
),
-- 8. ADDITIONAL DEMO VENUE
(
  'venue-boardroom-b',
  'Boardroom B',
  'Academic Administration Block',
  'Boardroom',
  '[Demonstration Venue] Intimate high-level boardroom for academic council sub-committees, external review panels, and research dissertation defenses.',
  6, 15, 12,
  ARRAY['Solid Teak Wood Board Table', 'Acoustic Sound Insulation', 'Padded High-Back Armchairs'],
  ARRAY['Projector and display screen', 'Video conferencing equipment', 'Air conditioning', 'Wi-Fi'],
  '09:00:00', '18:00:00',
  ARRAY['Elevator Access'],
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
  TRUE, 'normal', TRUE, TRUE, 'Administration Block, Level 2, Room A-202'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Maintenance Block
INSERT INTO venue_blocks (
  id, venue_id, venue_name, blocked_start, blocked_end, reason, created_by, created_at
) VALUES (
  'maint-001',
  'venue-sambhram',
  'Sambhram Hall',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '10 days 10 hours',
  'Semi-annual stage acoustic calibration, motorized curtain lubrication, and projector lamp servicing by authorized OEM technician.',
  'Dr. Rajesh Hegde',
  NOW()
) ON CONFLICT (id) DO NOTHING;
