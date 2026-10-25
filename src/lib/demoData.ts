import { Venue, Booking, UserProfile, VenueMaintenanceBlock, BookingHistoryItem, NotificationItem } from '@/types'

/**
 * INITIAL INSTITUTIONAL ACCOUNTS
 * Only the Campus Administrator is pre-seeded so they can log in with verified credentials.
 * Organizers must register their own accounts first before submitting bookings.
 */
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    fullName: 'Campus Administrator',
    email: 'admin@nmamit.in',
    password: 'Admin@123',
    role: 'admin',
    department: 'Office of Campus Facilities & Event Administration',
    phone: '+91 8258 281263',
    createdAt: '2025-01-10T09:00:00Z'
  }
]

/**
 * NMAMIT OFFICIAL VENUES
 * Photos have been removed for a clean, simplified design.
 */
export const INITIAL_VENUES: Venue[] = [
  {
    id: 'venue-nandini',
    name: 'Nandini Seminar Hall',
    block: 'APJ Kalam Block',
    venueType: 'Seminar Hall',
    description: 'Premier seminar hall located on the 2nd floor of APJ Kalam Block. Equipped with tiered seating, dual air-conditioning, motorized projector screen, and high-fidelity PA system.',
    minCapacity: 50,
    maxCapacity: 100,
    recommendedCapacity: 80,
    facilities: ['Tiered Theater Seating', 'Air Conditioned', 'Power Backup', 'Smart Lectern', 'Acoustic Wall Panels'],
    equipment: ['Projector and display screen', 'Wireless microphone', 'Wired microphone', 'Speakers and sound system', 'Air conditioning', 'Wi-Fi', 'Podium'],
    operatingHours: { start: '08:00', end: '20:00' },
    accessibilityFeatures: ['Elevator Access in Block', 'Wheelchair Ramp to Stage', 'Designated Front Seating'],
    imageUrl: '',
    isActive: true,
    maintenanceStatus: 'normal',
    approvalRequired: true,
    isDemoVenue: false,
    locationNotes: 'APJ Kalam Block, 2nd Floor, Room K-204',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'venue-shambavi',
    name: 'Shambavi Seminar Hall',
    block: 'APJ Kalam Block',
    venueType: 'Seminar Hall',
    description: 'High-capacity seminar auditorium in APJ Kalam Block featuring dual HD laser projectors, video-conferencing bridge, professional stage lighting, and acoustic treatment.',
    minCapacity: 100,
    maxCapacity: 200,
    recommendedCapacity: 160,
    facilities: ['Stepped Seating', 'Dual Split AC Units', 'VIP Green Room', 'Live Streaming Station', 'AV Control Booth'],
    equipment: ['Projector and display screen', 'Wireless microphone', 'Wired microphone', 'Speakers and sound system', 'Air conditioning', 'Video conferencing equipment', 'Wi-Fi', 'Podium', 'Recording equipment'],
    operatingHours: { start: '08:00', end: '21:00' },
    accessibilityFeatures: ['Elevator Access', 'Wide Double Doors', 'Hearing Loop System'],
    imageUrl: '',
    isActive: true,
    maintenanceStatus: 'normal',
    approvalRequired: true,
    isDemoVenue: false,
    locationNotes: 'APJ Kalam Block, Ground Floor, East Wing',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'venue-sambhram',
    name: 'Sambhram Hall',
    block: 'Ramanujan Block',
    venueType: 'Auditorium',
    description: 'The flagship central auditorium of NMAMIT. Features grand proscenium stage, digital line-array sound system, motorized theatrical lights, VIP lounge, and expansive capacity for mega conventions and fests.',
    minCapacity: 200,
    maxCapacity: 500,
    recommendedCapacity: 450,
    facilities: ['Grand Proscenium Stage', 'Central HVAC Air Conditioning', 'Green Rooms', 'VIP Lounges', 'Balcony Seating', 'Professional AV Booth'],
    equipment: ['Projector and display screen', 'Wireless microphone', 'Wired microphone', 'Speakers and sound system', 'Air conditioning', 'Video conferencing equipment', 'Wi-Fi', 'Podium', 'Recording equipment'],
    operatingHours: { start: '08:00', end: '22:00' },
    accessibilityFeatures: ['Ground-level Wheelchair Access', 'Ramp to Main Stage', 'Accessible Restrooms'],
    imageUrl: '',
    isActive: true,
    maintenanceStatus: 'normal',
    approvalRequired: true,
    isDemoVenue: false,
    locationNotes: 'Ramanujan Block, Central Quadrangle Entrance',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'venue-phalguni',
    name: 'Phalguni Hall',
    block: 'Ramanujan Block',
    venueType: 'Seminar Hall',
    description: 'Modern hall in Ramanujan Block tailored for interactive department symposiums, student presentations, workshops, and guest lectures with interactive display.',
    minCapacity: 50,
    maxCapacity: 80,
    recommendedCapacity: 65,
    facilities: ['Cushioned Seating', 'Quiet Acoustic Isolation', 'Presenter Touch Console', 'Air Conditioning'],
    equipment: ['Projector and display screen', 'Wireless microphone', 'Speakers and sound system', 'Air conditioning', 'Whiteboard', 'Wi-Fi', 'Podium'],
    operatingHours: { start: '08:30', end: '19:30' },
    accessibilityFeatures: ['Elevator Access', 'Wide Aisles'],
    imageUrl: '',
    isActive: true,
    maintenanceStatus: 'normal',
    approvalRequired: true,
    isDemoVenue: false,
    locationNotes: 'Ramanujan Block, 1st Floor, Room R-108',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
]

/**
 * CLEAN INITIAL DATA
 * No pre-existing bookings, maintenance blocks, notifications, or history.
 * An organizer must register first, submit a booking, and the administrator will accept or reject it.
 */
export const INITIAL_BOOKINGS: Booking[] = []

export const INITIAL_MAINTENANCE_BLOCKS: VenueMaintenanceBlock[] = []

export const INITIAL_NOTIFICATIONS: NotificationItem[] = []

export const INITIAL_HISTORY: BookingHistoryItem[] = []
