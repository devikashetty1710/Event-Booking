export type UserRole = 'user' | 'admin' | 'venue_manager'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  password?: string
  role: UserRole
  department: string
  avatarUrl?: string
  phone?: string
  createdAt: string
}

export type VenueBlock = 
  | 'APJ Kalam Block'
  | 'Ramanujan Block'
  | 'Academic Administration Block'
  | 'Innovation and Research Block'
  | 'Central Campus'

export type VenueType = 
  | 'Auditorium'
  | 'Seminar Hall'
  | 'Conference Room'
  | 'Boardroom'
  | 'Lab'
  | 'Open-Air Facility'

export interface Venue {
  id: string
  name: string
  block: VenueBlock
  venueType: VenueType
  description: string
  minCapacity: number
  maxCapacity: number
  recommendedCapacity: number
  facilities: string[]
  equipment: string[]
  operatingHours: {
    start: string // e.g. "08:00"
    end: string   // e.g. "20:00"
  }
  accessibilityFeatures: string[]
  imageUrl: string
  isActive: boolean
  maintenanceStatus: 'normal' | 'under_maintenance' | 'temporarily_closed'
  approvalRequired: boolean
  isDemoVenue: boolean // true for illustrative venues, false for the 4 real NMAMIT venues
  locationNotes?: string
  createdAt: string
  updatedAt: string
}

export type EventCategory = 
  | 'seminar'
  | 'workshop'
  | 'conference'
  | 'club_activity'
  | 'cultural_event'
  | 'technical_event'
  | 'meeting'
  | 'guest_lecture'
  | 'other'

export type BookingStatus = 
  | 'Draft'
  | 'Pending Approval'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'

export type EventVisibility = 'public' | 'campus_only' | 'private_invited'

export interface BookingEquipmentRequirement {
  name: string
  isMandatory: boolean
}

export interface Booking {
  id: string
  referenceCode: string
  organizerId: string
  organizerName: string
  organizerEmail: string
  organizerPhone?: string
  department: string
  eventTitle: string
  eventDescription: string
  eventCategory: EventCategory
  expectedAttendees: number
  visibility: EventVisibility
  
  requestedVenueId: string
  assignedVenueId?: string // Set upon review or reassignment
  
  // Date & Time in ISO 8601 strings
  requestedDate: string // YYYY-MM-DD
  requestedStart: string // HH:mm or ISO
  requestedEnd: string   // HH:mm or ISO
  setupStart?: string    // buffer before
  cleanupEnd?: string    // buffer after
  
  equipment: BookingEquipmentRequirement[]
  additionalNotes?: string
  
  status: BookingStatus
  reviewNotes?: string
  rejectionReason?: string
  reviewedBy?: string
  reviewedByName?: string
  reviewedAt?: string
  
  qrCheckInToken?: string
  
  createdAt: string
  updatedAt: string
}

export interface VenueMaintenanceBlock {
  id: string
  venueId: string
  venueName?: string
  blockedStart: string // ISO string
  blockedEnd: string   // ISO string
  reason: string
  createdBy: string
  createdAt: string
}

export interface BookingHistoryItem {
  id: string
  bookingId: string
  eventTitle?: string
  venueName?: string
  previousStatus: BookingStatus
  newStatus: BookingStatus
  actionType?: 'Created' | 'Approved' | 'Rejected' | 'Cancelled' | 'Reassigned' | 'Rescheduled' | 'Modified'
  changedBy: string
  changedByName: string
  changedByRole?: UserRole
  comments: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  userId: string
  bookingId?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'danger'
  isRead: boolean
  createdAt: string
}

export interface VenueRecommendation {
  venue: Venue
  suitabilityScore: number // 0 to 100
  capacityMatchRatio: number // expected / capacity
  isAvailable: boolean
  explanation: string
  positiveFactors: string[]
  concerns: string[]
  conflictsWith?: {
    eventTitle: string
    timeSlot: string
  }
}

export interface AlternativeSlotSuggestion {
  venueId: string
  venueName: string
  date: string
  startTime: string
  endTime: string
  reason: string
}
