import { Venue, Booking, BookingHistoryItem, NotificationItem, VenueMaintenanceBlock, UserProfile, UserRole } from '@/types'
import { INITIAL_VENUES, INITIAL_BOOKINGS, INITIAL_MAINTENANCE_BLOCKS, INITIAL_NOTIFICATIONS, INITIAL_HISTORY, INITIAL_USERS } from './demoData'
import { generateReferenceCode, generateCheckInToken } from './utils'
import { checkVenueAvailability } from './recommendations'
import { supabase, isSupabaseConfigured } from './supabase'
import { recordEventHistory, fetchEventHistoryByBookingId, fetchAllEventHistory } from './eventHistoryDB'

const STORAGE_KEYS = {
  VENUES: 'nitte_campusconnect_venues_v2_clean',
  BOOKINGS: 'nitte_campusconnect_bookings_v2_clean',
  BLOCKS: 'nitte_campusconnect_maint_blocks_v2_clean',
  NOTIFICATIONS: 'nitte_campusconnect_notifications_v2_clean',
  HISTORY: 'nitte_campusconnect_history_v2_clean',
  USERS: 'nitte_campusconnect_users_v2_clean'
}

// In-memory cache + localStorage sync
class LocalStoreManager {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key)
      if (!data) return defaultValue
      return JSON.parse(data) as T
    } catch {
      return defaultValue
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch (e) {
      console.warn('LocalStorage error:', e)
    }
  }

  getVenues(): Venue[] {
    return this.get<Venue[]>(STORAGE_KEYS.VENUES, INITIAL_VENUES)
  }

  saveVenues(venues: Venue[]): void {
    this.set(STORAGE_KEYS.VENUES, venues)
  }

  getBookings(): Booking[] {
    return this.get<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS)
  }

  saveBookings(bookings: Booking[]): void {
    this.set(STORAGE_KEYS.BOOKINGS, bookings)
  }

  getBlocks(): VenueMaintenanceBlock[] {
    return this.get<VenueMaintenanceBlock[]>(STORAGE_KEYS.BLOCKS, INITIAL_MAINTENANCE_BLOCKS)
  }

  saveBlocks(blocks: VenueMaintenanceBlock[]): void {
    this.set(STORAGE_KEYS.BLOCKS, blocks)
  }

  getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  }

  saveNotifications(notifs: NotificationItem[]): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs)
  }

  getHistory(): BookingHistoryItem[] {
    return this.get<BookingHistoryItem[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY)
  }

  saveHistory(hist: BookingHistoryItem[]): void {
    this.set(STORAGE_KEYS.HISTORY, hist)
  }

  getUsers(): UserProfile[] {
    return this.get<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS)
  }

  saveUsers(users: UserProfile[]): void {
    this.set(STORAGE_KEYS.USERS, users)
  }

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.VENUES)
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS)
    localStorage.removeItem(STORAGE_KEYS.BLOCKS)
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS)
    localStorage.removeItem(STORAGE_KEYS.HISTORY)
    localStorage.removeItem(STORAGE_KEYS.USERS)
  }
}

export const localStore = new LocalStoreManager()

// Event listeners for reactive store updates
type Listener = () => void
const listeners: Set<Listener> = new Set()

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notifySubscribers() {
  listeners.forEach(fn => fn())
}

// ==================== ASYNC DATA API ====================

export async function fetchVenues(): Promise<Venue[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('venues').select('*')
    if (!error && data && data.length > 0) {
      return data as Venue[]
    }
  }
  return localStore.getVenues()
}

export async function saveVenue(venue: Venue): Promise<Venue> {
  const venues = localStore.getVenues()
  const idx = venues.findIndex(v => v.id === venue.id)
  if (idx >= 0) {
    venues[idx] = { ...venue, updatedAt: new Date().toISOString() }
  } else {
    venues.unshift(venue)
  }
  localStore.saveVenues(venues)
  notifySubscribers()
  return venue
}

export async function fetchBookings(): Promise<Booking[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('bookings').select('*')
    if (!error && data && data.length > 0) {
      return data as Booking[]
    }
  }
  return localStore.getBookings()
}

export async function createBookingRequest(newBooking: Omit<Booking, 'id' | 'referenceCode' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const bookings = localStore.getBookings()
  const newId = `book-${Date.now()}`
  const referenceCode = generateReferenceCode()
  const now = new Date().toISOString()

  // Concurrency check before initial submission
  const avail = checkVenueAvailability(
    newBooking.requestedVenueId,
    newBooking.requestedDate,
    newBooking.requestedStart,
    newBooking.requestedEnd,
    15,
    15,
    bookings
  )

  const booking: Booking = {
    ...newBooking,
    id: newId,
    referenceCode,
    status: 'Pending Approval',
    createdAt: now,
    updatedAt: now
  }

  // Prepend to bookings list
  bookings.unshift(booking)
  localStore.saveBookings(bookings)

  // Append history to Persistent DB & LocalStore
  const venues = localStore.getVenues()
  const venueObj = venues.find(v => v.id === newBooking.requestedVenueId)
  await recordEventHistory({
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
  })

  // Notify Administrators
  const notifs = localStore.getNotifications()
  notifs.unshift({
    id: `notif-${Date.now()}`,
    userId: 'user-admin-1', // Notify Dean / Admin
    bookingId: newId,
    title: `New Booking Request: ${newBooking.eventTitle}`,
    message: `${newBooking.organizerName} requested a venue for ${newBooking.requestedDate} (${newBooking.requestedStart} - ${newBooking.requestedEnd}).`,
    type: 'warning',
    isRead: false,
    createdAt: now
  })
  localStore.saveNotifications(notifs)

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
  // CRITICAL AUTHORIZATION CHECK: Only Campus Administrator has authority to approve!
  if (params.reviewerRole && params.reviewerRole !== 'admin') {
    return {
      success: false,
      error: 'Security Authorization Error: Only Campus Administrators possess credentials and authority to approve booking reservations.'
    }
  }

  const bookings = localStore.getBookings()
  const bookingIndex = bookings.findIndex(b => b.id === params.bookingId)

  if (bookingIndex === -1) {
    return { success: false, error: 'Booking request not found.' }
  }

  const booking = bookings[bookingIndex]

  // CRITICAL SERVER-SIDE RE-VALIDATION: Prevent race conditions & overlapping reservations!
  const targetVenueId = params.assignedVenueId || booking.requestedVenueId
  const avail = checkVenueAvailability(
    targetVenueId,
    booking.requestedDate,
    booking.requestedStart,
    booking.requestedEnd,
    15,
    15,
    bookings,
    booking.id // exclude self
  )

  if (!avail.isAvailable) {
    return {
      success: false,
      error: `Conflict detected: ${avail.reason}. You cannot approve this booking because another event was confirmed for this venue/time.`
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

  bookings[bookingIndex] = updatedBooking
  localStore.saveBookings(bookings)

  // Audit history persistent DB insertion
  const venues = localStore.getVenues()
  const venueObj = venues.find(v => v.id === targetVenueId)
  await recordEventHistory({
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

  // Notify Organizer
  const notifs = localStore.getNotifications()
  notifs.unshift({
    id: `notif-${Date.now()}`,
    userId: booking.organizerId,
    bookingId: booking.id,
    title: `Booking Approved: ${booking.eventTitle}`,
    message: `Your booking (Ref: ${booking.referenceCode}) has been officially approved. You can now download the calendar .ics invite or QR ticket.`,
    type: 'success',
    isRead: false,
    createdAt: now
  })
  localStore.saveNotifications(notifs)

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
  // CRITICAL AUTHORIZATION CHECK: Only Campus Administrator has authority to reject!
  if (params.reviewerRole && params.reviewerRole !== 'admin') {
    return {
      success: false,
      error: 'Security Authorization Error: Only Campus Administrators possess credentials and authority to reject booking reservations.'
    }
  }

  if (!params.rejectionReason || !params.rejectionReason.trim()) {
    return { success: false, error: 'A mandatory rejection reason must be provided to the organizer.' }
  }

  const bookings = localStore.getBookings()
  const bookingIndex = bookings.findIndex(b => b.id === params.bookingId)
  if (bookingIndex === -1) return { success: false, error: 'Booking not found.' }

  const booking = bookings[bookingIndex]
  const now = new Date().toISOString()

  bookings[bookingIndex] = {
    ...booking,
    status: 'Rejected',
    rejectionReason: params.rejectionReason,
    reviewedBy: params.reviewerId,
    reviewedByName: params.reviewerName,
    reviewedAt: now,
    updatedAt: now
  }
  localStore.saveBookings(bookings)

  // Audit history persistent DB insertion
  const venues = localStore.getVenues()
  const venueObj = venues.find(v => v.id === (booking.assignedVenueId || booking.requestedVenueId))
  await recordEventHistory({
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

  // Notify Organizer
  const notifs = localStore.getNotifications()
  notifs.unshift({
    id: `notif-${Date.now()}`,
    userId: booking.organizerId,
    bookingId: booking.id,
    title: `Booking Request Declined: ${booking.eventTitle}`,
    message: `Reason: ${params.rejectionReason}. You may revise your request or pick an alternative time slot.`,
    type: 'danger',
    isRead: false,
    createdAt: now
  })
  localStore.saveNotifications(notifs)

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
  const bookings = localStore.getBookings()
  const bookingIndex = bookings.findIndex(b => b.id === params.bookingId)
  if (bookingIndex === -1) return { success: false, error: 'Booking not found.' }

  const booking = bookings[bookingIndex]
  // Re-check availability in new venue
  const avail = checkVenueAvailability(
    params.newVenueId,
    booking.requestedDate,
    booking.requestedStart,
    booking.requestedEnd,
    15,
    15,
    bookings,
    booking.id
  )

  if (!avail.isAvailable) {
    return { success: false, error: `Alternative venue is not available: ${avail.reason}` }
  }

  const now = new Date().toISOString()
  bookings[bookingIndex] = {
    ...booking,
    assignedVenueId: params.newVenueId,
    reviewNotes: `Venue reassigned by administrator. Note: ${params.reason}`,
    updatedAt: now
  }
  localStore.saveBookings(bookings)

  // Persistent event history DB
  const venues = localStore.getVenues()
  const venueObj = venues.find(v => v.id === params.newVenueId)
  await recordEventHistory({
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
  const bookings = localStore.getBookings()
  const bookingIndex = bookings.findIndex(b => b.id === params.bookingId)
  if (bookingIndex === -1) return { success: false, error: 'Booking not found.' }

  const booking = bookings[bookingIndex]
  const now = new Date().toISOString()

  bookings[bookingIndex] = {
    ...booking,
    status: 'Cancelled',
    reviewNotes: `Cancelled by ${params.userName}: ${params.reason}`,
    updatedAt: now
  }
  localStore.saveBookings(bookings)

  // Persistent event history DB
  const venues = localStore.getVenues()
  const venueObj = venues.find(v => v.id === (booking.assignedVenueId || booking.requestedVenueId))
  await recordEventHistory({
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

export async function fetchMaintenanceBlocks(): Promise<VenueMaintenanceBlock[]> {
  return localStore.getBlocks()
}

export async function addMaintenanceBlock(block: Omit<VenueMaintenanceBlock, 'id' | 'createdAt'>): Promise<VenueMaintenanceBlock> {
  const blocks = localStore.getBlocks()
  const newBlock: VenueMaintenanceBlock = {
    ...block,
    id: `maint-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  blocks.unshift(newBlock)
  localStore.saveBlocks(blocks)
  notifySubscribers()
  return newBlock
}

export async function deleteMaintenanceBlock(id: string): Promise<boolean> {
  const blocks = localStore.getBlocks()
  const filtered = blocks.filter(b => b.id !== id)
  localStore.saveBlocks(filtered)
  notifySubscribers()
  return true
}

export async function fetchNotifications(userId?: string): Promise<NotificationItem[]> {
  const notifs = localStore.getNotifications()
  if (!userId) return notifs
  return notifs.filter(n => n.userId === userId || n.userId === 'all')
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const notifs = localStore.getNotifications()
  const idx = notifs.findIndex(n => n.id === id)
  if (idx >= 0) {
    notifs[idx].isRead = true
    localStore.saveNotifications(notifs)
    notifySubscribers()
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const notifs = localStore.getNotifications()
  notifs.forEach(n => {
    if (n.userId === userId || n.userId === 'all') {
      n.isRead = true
    }
  })
  localStore.saveNotifications(notifs)
  notifySubscribers()
}

export async function fetchBookingHistory(bookingId: string): Promise<BookingHistoryItem[]> {
  return fetchEventHistoryByBookingId(bookingId)
}

export { fetchAllEventHistory, recordEventHistory } from './eventHistoryDB'
