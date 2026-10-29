/**
 * CampusConnect - Storage API
 * ============================
 * All data is persisted in IndexedDB (via db.ts) as the single source of truth.
 * Data survives page refreshes, browser restarts, and tab closures.
 * Data is only cleared if the user explicitly wipes browser site data.
 *
 * Architecture:
 *  - Primary store: IndexedDB (browser's transactional DB — survives refreshes)
 *  - Seeding: INITIAL_* data is written to IndexedDB on first run only
 *  - No localStorage used for business data (only a seed flag boolean)
 */

import {
  Venue,
  Booking,
  BookingHistoryItem,
  NotificationItem,
  VenueMaintenanceBlock,
  UserProfile,
  UserRole
} from '@/types'
import {
  INITIAL_VENUES,
  INITIAL_MAINTENANCE_BLOCKS,
  INITIAL_USERS
} from './demoData'
import { generateReferenceCode, generateCheckInToken } from './utils'
import { checkVenueAvailability } from './recommendations'
import {
  VenuesDB,
  BookingsDB,
  NotificationsDB,
  HistoryDB,
  MaintenanceDB,
  UsersDB,
  isDBSeeded,
  markDBSeeded,
  openDB,
  dbClear
} from './db'
import { supabase, isSupabaseConfigured } from './supabase'

// --------------------------------------------------------------------------
// Reactive subscriber system (for UI re-renders)
// --------------------------------------------------------------------------
type Listener = () => void
const listeners: Set<Listener> = new Set()

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifySubscribers() {
  listeners.forEach(fn => fn())
}

// --------------------------------------------------------------------------
// Database Initialisation & Seeding
// --------------------------------------------------------------------------

let _initPromise: Promise<void> | null = null

/**
 * Initialises the IndexedDB database and seeds it with initial data on the
 * very first run. Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initDB(): Promise<void> {
  if (!_initPromise) {
    _initPromise = _doInit()
  }
  await _initPromise
  syncLocalBookingsToSupabase().catch(console.warn)
}

async function _doInit(): Promise<void> {
  // Ensure the DB schema is created
  await openDB()

  if (isDBSeeded()) return  // Already seeded on a previous run

  // Seed venues (campus halls)
  const existingVenues = await VenuesDB.getAll()
  if (existingVenues.length === 0) {
    await VenuesDB.saveAll(INITIAL_VENUES)
  }

  // Seed the admin user
  const existingAdmin = await UsersDB.getByEmail('admin@nmamit.in')
  if (!existingAdmin) {
    await UsersDB.saveAll(INITIAL_USERS)
  }

  // Seed maintenance blocks (empty by default)
  const existingBlocks = await MaintenanceDB.getAll()
  if (existingBlocks.length === 0) {
    await MaintenanceDB.saveAll(INITIAL_MAINTENANCE_BLOCKS)
  }

  markDBSeeded()
  // Trigger background mirror sync to Supabase if configured
  syncLocalBookingsToSupabase().catch(console.warn)
}

// --------------------------------------------------------------------------
// Backwards-compatible localStore shim
// Used by legacy code that hasn't been migrated yet (eventHistoryDB.ts).
// All calls are synchronous but delegate to the in-memory cache populated
// during the async init phase.
// --------------------------------------------------------------------------

/**
 * Synchronous in-memory shim that mirrors data already in IndexedDB.
 * This exists ONLY for backward compat with eventHistoryDB.ts which
 * uses localStore.getHistory() / localStore.saveHistory() synchronously.
 * All other code should use the async functions below.
 */
class LocalStoreShim {
  async resetAll(): Promise<void> {
    await initDB()
    await Promise.all([dbClear('venues'), dbClear('bookings')])
    await VenuesDB.saveAll(INITIAL_VENUES)
    this._histCache = []
  }

  // History shim (backed by IndexedDB via HistoryDB)
  getHistory(): BookingHistoryItem[] {
    // We can't do async here, so we return the last-known snapshot.
    // The async layer always reads from IndexedDB directly.
    return this._histCache
  }
  saveHistory(hist: BookingHistoryItem[]): void {
    this._histCache = hist
    // Fire-and-forget persist to IndexedDB
    HistoryDB.saveAll(hist).catch(e => console.warn('saveHistory IDB error:', e))
  }
  private _histCache: BookingHistoryItem[] = []

  // Users shim (read-only — use AuthContext / UsersDB for writes)
  getUsers(): UserProfile[] { return this._usersCache }
  saveUsers(users: UserProfile[]): void {
    this._usersCache = users
    UsersDB.saveAll(users).catch(e => console.warn('saveUsers IDB error:', e))
  }
  private _usersCache: UserProfile[] = []

  // Notifications shim
  getNotifications(): NotificationItem[] { return this._notifsCache }
  saveNotifications(notifs: NotificationItem[]): void {
    this._notifsCache = notifs
    NotificationsDB.saveAll(notifs).catch(e => console.warn('saveNotifs IDB error:', e))
  }
  private _notifsCache: NotificationItem[] = []
}

/** @deprecated Use IndexedDB accessors (VenuesDB, BookingsDB, etc.) directly. */
export const localStore = new LocalStoreShim()

// --------------------------------------------------------------------------
// Venues
// --------------------------------------------------------------------------

export async function fetchVenues(): Promise<Venue[]> {
  await initDB()
  const venues = await VenuesDB.getAll()
  return venues.sort((a, b) => a.name.localeCompare(b.name))
}

export async function saveVenue(venue: Venue): Promise<Venue> {
  await initDB()
  const updated = { ...venue, updatedAt: new Date().toISOString() }
  await VenuesDB.save(updated)
  notifySubscribers()
  return updated
}

// --------------------------------------------------------------------------
// Bookings
// --------------------------------------------------------------------------

export async function fetchBookings(): Promise<Booking[]> {
  await initDB()
  const bookings = await BookingsDB.getAll()
  // Sort newest first
  return bookings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function createBookingRequest(
  newBooking: Omit<Booking, 'id' | 'referenceCode' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  await initDB()

  const allBookings = await BookingsDB.getAll()
  const newId = `book-${Date.now()}`
  const referenceCode = generateReferenceCode()
  const now = new Date().toISOString()

  // Concurrency / availability check
  checkVenueAvailability(
    newBooking.requestedVenueId,
    newBooking.requestedDate,
    newBooking.requestedStart,
    newBooking.requestedEnd,
    15,
    15,
    allBookings
  )

  const booking: Booking = {
    ...newBooking,
    id: newId,
    referenceCode,
    status: 'Pending Approval',
    createdAt: now,
    updatedAt: now
  }

  // Persist to IndexedDB
  await BookingsDB.save(booking)

  // Cloud Mirror: If Supabase credentials are configured, mirror the booking record to cloud
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('bookings').upsert({
        id: booking.id,
        reference_code: booking.referenceCode,
        organizer_name: booking.organizerName,
        organizer_email: booking.organizerEmail,
        organizer_phone: booking.organizerPhone,
        department: booking.department,
        event_title: booking.eventTitle,
        event_description: booking.eventDescription,
        event_category: booking.eventCategory,
        expected_attendees: booking.expectedAttendees,
        visibility: booking.visibility,
        requested_venue_id: booking.requestedVenueId,
        requested_date: booking.requestedDate,
        requested_start: booking.requestedStart,
        requested_end: booking.requestedEnd,
        setup_start: booking.setupStart,
        cleanup_end: booking.cleanupEnd,
        additional_notes: booking.additionalNotes,
        status: booking.status
      })
      if (error) {
        console.error('Supabase booking sync error:', error)
      }
    } catch (cloudErr) {
      console.warn('Supabase remote sync warning:', cloudErr)
    }
  }

  // Audit history
  const allVenues = await VenuesDB.getAll()
  const venueObj = allVenues.find(v => v.id === newBooking.requestedVenueId)
  const histEntry: BookingHistoryItem = {
    id: `hist-${Date.now()}`,
    bookingId: newId,
    eventTitle: newBooking.eventTitle,
    venueName: venueObj?.name || 'Requested Venue',
    previousStatus: 'Draft',
    newStatus: 'Pending Approval',
    actionType: 'Created',
    changedBy: newBooking.organizerId,
    changedByName: newBooking.organizerName,
    changedByRole: 'user',
    comments: 'Booking request created and submitted for administrator review.',
    createdAt: now
  }
  await HistoryDB.save(histEntry)

  // Notify admin
  const adminNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    userId: 'user-admin-1',
    bookingId: newId,
    title: `New Booking Request: ${newBooking.eventTitle}`,
    message: `${newBooking.organizerName} requested a venue for ${newBooking.requestedDate} (${newBooking.requestedStart} – ${newBooking.requestedEnd}).`,
    type: 'warning',
    isRead: false,
    createdAt: now
  }
  await NotificationsDB.save(adminNotif)

  notifySubscribers()
  return { success: true, booking }
}

export async function approveBookingTransactional(params: {
  bookingId: string
  assignedVenueId: string
  reviewerId: string
  reviewerName: string
  reviewerRole?: UserRole
  reviewNotes?: string
}): Promise<{ success: boolean; error?: string; booking?: Booking }> {
  if (params.reviewerRole && params.reviewerRole !== 'admin') {
    return {
      success: false,
      error: 'Security Authorization Error: Only Campus Administrators can approve bookings.'
    }
  }

  await initDB()
  const booking = await BookingsDB.getById(params.bookingId)
  if (!booking) return { success: false, error: 'Booking request not found.' }

  const allBookings = await BookingsDB.getAll()
  const targetVenueId = params.assignedVenueId || booking.requestedVenueId
  const avail = checkVenueAvailability(
    targetVenueId,
    booking.requestedDate,
    booking.requestedStart,
    booking.requestedEnd,
    15,
    15,
    allBookings,
    booking.id
  )

  if (!avail.isAvailable) {
    return {
      success: false,
      error: `Conflict detected: ${avail.reason}. Another confirmed event already occupies this slot.`
    }
  }

  const now = new Date().toISOString()
  const qrToken = generateCheckInToken(booking.id)

  const updatedBooking: Booking = {
    ...booking,
    status: 'Approved',
    assignedVenueId: targetVenueId,
    reviewedBy: params.reviewerId,
    reviewedByName: params.reviewerName,
    reviewNotes: params.reviewNotes || 'Approved by campus administration.',
    reviewedAt: now,
    updatedAt: now,
    qrCheckInToken: qrToken
  }

  await BookingsDB.save(updatedBooking)

  // Audit history
  const allVenues = await VenuesDB.getAll()
  const venueObj = allVenues.find(v => v.id === targetVenueId)
  await HistoryDB.save({
    id: `hist-${Date.now()}`,
    bookingId: booking.id,
    eventTitle: booking.eventTitle,
    venueName: venueObj?.name || targetVenueId,
    previousStatus: booking.status,
    newStatus: 'Approved',
    actionType: 'Approved',
    changedBy: params.reviewerId,
    changedByName: params.reviewerName,
    changedByRole: 'admin',
    comments: params.reviewNotes || 'Booking approved and scheduled onto campus calendar.',
    createdAt: now
  })

  // Notify organizer
  await NotificationsDB.save({
    id: `notif-${Date.now()}`,
    userId: booking.organizerId,
    bookingId: booking.id,
    title: `Booking Approved: ${booking.eventTitle}`,
    message: `Your booking (Ref: ${booking.referenceCode}) has been officially approved.`,
    type: 'success',
    isRead: false,
    createdAt: now
  })

  syncBookingUpdateToSupabase(booking.id, {
    status: 'Approved',
    assigned_venue_id: targetVenueId,
    review_notes: params.reviewNotes || 'Approved by campus administration.',
    reviewed_by_name: params.reviewerName,
    reviewed_at: now
  })

  notifySubscribers()
  return { success: true, booking: updatedBooking }
}

export async function rejectBooking(params: {
  bookingId: string
  reviewerId: string
  reviewerName: string
  reviewerRole?: UserRole
  rejectionReason: string
}): Promise<{ success: boolean; error?: string }> {
  if (params.reviewerRole && params.reviewerRole !== 'admin') {
    return {
      success: false,
      error: 'Security Authorization Error: Only Campus Administrators can reject bookings.'
    }
  }

  if (!params.rejectionReason?.trim()) {
    return { success: false, error: 'A rejection reason must be provided.' }
  }

  await initDB()
  const booking = await BookingsDB.getById(params.bookingId)
  if (!booking) return { success: false, error: 'Booking not found.' }

  const now = new Date().toISOString()
  await BookingsDB.save({
    ...booking,
    status: 'Rejected',
    rejectionReason: params.rejectionReason,
    reviewedBy: params.reviewerId,
    reviewedByName: params.reviewerName,
    reviewedAt: now,
    updatedAt: now
  })

  const allVenues = await VenuesDB.getAll()
  const venueObj = allVenues.find(v => v.id === (booking.assignedVenueId || booking.requestedVenueId))
  await HistoryDB.save({
    id: `hist-${Date.now()}`,
    bookingId: booking.id,
    eventTitle: booking.eventTitle,
    venueName: venueObj?.name || 'Campus Venue',
    previousStatus: booking.status,
    newStatus: 'Rejected',
    actionType: 'Rejected',
    changedBy: params.reviewerId,
    changedByName: params.reviewerName,
    changedByRole: 'admin',
    comments: `Rejected by administration: ${params.rejectionReason}`,
    createdAt: now
  })

  await NotificationsDB.save({
    id: `notif-${Date.now()}`,
    userId: booking.organizerId,
    bookingId: booking.id,
    title: `Booking Request Declined: ${booking.eventTitle}`,
    message: `Reason: ${params.rejectionReason}. You may revise your request or pick an alternative slot.`,
    type: 'danger',
    isRead: false,
    createdAt: now
  })

  notifySubscribers()
  return { success: true }
}

export async function reassignBooking(params: {
  bookingId: string
  newVenueId: string
  reviewerId: string
  reviewerName: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  await initDB()
  const booking = await BookingsDB.getById(params.bookingId)
  if (!booking) return { success: false, error: 'Booking not found.' }

  const allBookings = await BookingsDB.getAll()
  const avail = checkVenueAvailability(
    params.newVenueId,
    booking.requestedDate,
    booking.requestedStart,
    booking.requestedEnd,
    15,
    15,
    allBookings,
    booking.id
  )

  if (!avail.isAvailable) {
    return { success: false, error: `Alternative venue is not available: ${avail.reason}` }
  }

  const now = new Date().toISOString()
  await BookingsDB.save({
    ...booking,
    assignedVenueId: params.newVenueId,
    reviewNotes: `Venue reassigned by administrator. Note: ${params.reason}`,
    updatedAt: now
  })

  const allVenues = await VenuesDB.getAll()
  const venueObj = allVenues.find(v => v.id === params.newVenueId)
  await HistoryDB.save({
    id: `hist-${Date.now()}`,
    bookingId: booking.id,
    eventTitle: booking.eventTitle,
    venueName: venueObj?.name || params.newVenueId,
    previousStatus: booking.status,
    newStatus: booking.status,
    actionType: 'Reassigned',
    changedBy: params.reviewerId,
    changedByName: params.reviewerName,
    changedByRole: 'admin',
    comments: `Venue reassigned to ${venueObj?.name || params.newVenueId}. Reason: ${params.reason}`,
    createdAt: now
  })

  notifySubscribers()
  return { success: true }
}

export async function cancelBooking(params: {
  bookingId: string
  userId: string
  userName: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  await initDB()
  const booking = await BookingsDB.getById(params.bookingId)
  if (!booking) return { success: false, error: 'Booking not found.' }

  const now = new Date().toISOString()
  await BookingsDB.save({
    ...booking,
    status: 'Cancelled',
    reviewNotes: `Cancelled by ${params.userName}: ${params.reason}`,
    updatedAt: now
  })

  const allVenues = await VenuesDB.getAll()
  const venueObj = allVenues.find(v => v.id === (booking.assignedVenueId || booking.requestedVenueId))
  await HistoryDB.save({
    id: `hist-${Date.now()}`,
    bookingId: booking.id,
    eventTitle: booking.eventTitle,
    venueName: venueObj?.name || 'Campus Venue',
    previousStatus: booking.status,
    newStatus: 'Cancelled',
    actionType: 'Cancelled',
    changedBy: params.userId,
    changedByName: params.userName,
    changedByRole: 'user',
    comments: `Cancelled: ${params.reason}`,
    createdAt: now
  })

  notifySubscribers()
  return { success: true }
}

// --------------------------------------------------------------------------
// Maintenance Blocks
// --------------------------------------------------------------------------

export async function fetchMaintenanceBlocks(): Promise<VenueMaintenanceBlock[]> {
  await initDB()
  return MaintenanceDB.getAll()
}

export async function addMaintenanceBlock(
  block: Omit<VenueMaintenanceBlock, 'id' | 'createdAt'>
): Promise<VenueMaintenanceBlock> {
  await initDB()
  const newBlock: VenueMaintenanceBlock = {
    ...block,
    id: `maint-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  await MaintenanceDB.save(newBlock)
  notifySubscribers()
  return newBlock
}

export async function deleteMaintenanceBlock(id: string): Promise<boolean> {
  await initDB()
  await MaintenanceDB.delete(id)
  notifySubscribers()
  return true
}

// --------------------------------------------------------------------------
// Notifications
// --------------------------------------------------------------------------

export async function fetchNotifications(userId?: string): Promise<NotificationItem[]> {
  await initDB()
  if (!userId) return NotificationsDB.getAll()

  const all = await NotificationsDB.getAll()
  return all
    .filter(n => n.userId === userId || n.userId === 'all')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await initDB()
  const all = await NotificationsDB.getAll()
  const notif = all.find(n => n.id === id)
  if (notif) {
    await NotificationsDB.save({ ...notif, isRead: true })
    notifySubscribers()
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await initDB()
  const all = await NotificationsDB.getAll()
  const userNotifs = all.filter(n => n.userId === userId || n.userId === 'all')
  const updated = userNotifs.map(n => ({ ...n, isRead: true }))
  await NotificationsDB.saveAll(updated)
  notifySubscribers()
}

// --------------------------------------------------------------------------
// Booking History
// --------------------------------------------------------------------------

export async function fetchBookingHistory(bookingId: string): Promise<BookingHistoryItem[]> {
  await initDB()
  const items = await HistoryDB.getByBooking(bookingId)
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function fetchAllEventHistory(): Promise<BookingHistoryItem[]> {
  await initDB()
  const items = await HistoryDB.getAll()
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function recordEventHistory(entry: BookingHistoryItem): Promise<BookingHistoryItem> {
  await initDB()
  await HistoryDB.save(entry)
  return entry
}

/**
 * Synchronizes all local bookings from IndexedDB to Supabase cloud table.
 */
export async function syncLocalBookingsToSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  try {
    const all = await BookingsDB.getAll()
    for (const b of all) {
      const { error } = await supabase.from('bookings').upsert({
        id: b.id,
        reference_code: b.referenceCode,
        organizer_name: b.organizerName,
        organizer_email: b.organizerEmail,
        organizer_phone: b.organizerPhone,
        department: b.department,
        event_title: b.eventTitle,
        event_description: b.eventDescription,
        event_category: b.eventCategory,
        expected_attendees: b.expectedAttendees,
        visibility: b.visibility,
        requested_venue_id: b.requestedVenueId,
        requested_date: b.requestedDate,
        requested_start: b.requestedStart,
        requested_end: b.requestedEnd,
        setup_start: b.setupStart,
        cleanup_end: b.cleanupEnd,
        additional_notes: b.additionalNotes,
        status: b.status
      })
      if (error) {
        console.error('Supabase sync warning for', b.referenceCode, error.message)
      }
    }
  } catch (err) {
    console.error('Failed to sync bookings to Supabase:', err)
  }
}


/**
 * Mirrors a booking update (e.g. status changed to Approved/Rejected) to Supabase.
 */
export async function syncBookingUpdateToSupabase(bookingId: string, updates: Record<string, any>): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  try {
    const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId)
    if (error) console.error('Supabase booking update error:', error.message)
  } catch (err) {
    console.warn('Supabase update warning:', err)
  }
}
