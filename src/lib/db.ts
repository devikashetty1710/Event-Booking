/**
 * CampusConnect - Unified IndexedDB Database Manager
 * ===================================================
 * Single source of truth for ALL application data.
 * All stores persist across browser refreshes, tab closures, and reboots.
 * Data is ONLY lost if the user explicitly clears browser site data.
 *
 * Object Stores:
 *  - users          → UserProfile records (accounts, passwords, roles)
 *  - venues         → Campus venue details
 *  - bookings       → All event booking requests and their statuses
 *  - notifications  → In-app notification messages per user
 *  - event_history  → Audit trail of every booking status change
 *  - maintenance    → Venue maintenance blocks (scheduled downtime)
 */

import {
  UserProfile,
  Venue,
  Booking,
  NotificationItem,
  BookingHistoryItem,
  VenueMaintenanceBlock
} from '@/types'

// --------------------------------------------------------------------------
// Database Configuration
// --------------------------------------------------------------------------
const DB_NAME = 'CampusConnect_v3'
const DB_VERSION = 1

export type StoreNames =
  | 'users'
  | 'venues'
  | 'bookings'
  | 'notifications'
  | 'event_history'
  | 'maintenance'

// --------------------------------------------------------------------------
// Open / Upgrade Database
// --------------------------------------------------------------------------
let _dbPromise: Promise<IDBDatabase> | null = null

export function openDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // ── users ──────────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('users')) {
        const users = db.createObjectStore('users', { keyPath: 'id' })
        users.createIndex('email', 'email', { unique: true })
        users.createIndex('role', 'role', { unique: false })
      }

      // ── venues ─────────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('venues')) {
        const venues = db.createObjectStore('venues', { keyPath: 'id' })
        venues.createIndex('isActive', 'isActive', { unique: false })
        venues.createIndex('venueType', 'venueType', { unique: false })
      }

      // ── bookings ───────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('bookings')) {
        const bookings = db.createObjectStore('bookings', { keyPath: 'id' })
        bookings.createIndex('organizerId', 'organizerId', { unique: false })
        bookings.createIndex('status', 'status', { unique: false })
        bookings.createIndex('requestedDate', 'requestedDate', { unique: false })
        bookings.createIndex('referenceCode', 'referenceCode', { unique: true })
      }

      // ── notifications ──────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('notifications')) {
        const notifs = db.createObjectStore('notifications', { keyPath: 'id' })
        notifs.createIndex('userId', 'userId', { unique: false })
        notifs.createIndex('isRead', 'isRead', { unique: false })
        notifs.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // ── event_history ──────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('event_history')) {
        const history = db.createObjectStore('event_history', { keyPath: 'id' })
        history.createIndex('bookingId', 'bookingId', { unique: false })
        history.createIndex('createdAt', 'createdAt', { unique: false })
        history.createIndex('actionType', 'actionType', { unique: false })
      }

      // ── maintenance ────────────────────────────────────────────────────
      if (!db.objectStoreNames.contains('maintenance')) {
        const maint = db.createObjectStore('maintenance', { keyPath: 'id' })
        maint.createIndex('venueId', 'venueId', { unique: false })
        maint.createIndex('blockedStart', 'blockedStart', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      _dbPromise = null // allow retry
      reject(request.error || new Error('Failed to open IndexedDB'))
    }
    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked — please close other tabs running this app.')
    }
  })

  return _dbPromise
}

// --------------------------------------------------------------------------
// Generic CRUD helpers
// --------------------------------------------------------------------------

/** Get all records from a store. */
export async function dbGetAll<T>(store: StoreNames): Promise<T[]> {
  const db = await openDB()
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

/** Get a single record by its primary key. */
export async function dbGet<T>(store: StoreNames, key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** Get records by an index value (returns all matches). */
export async function dbGetByIndex<T>(
  store: StoreNames,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await openDB()
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const idx = tx.objectStore(store).index(indexName)
    const req = idx.getAll(value)
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

/** Find a record by an index value (returns first match only). */
export async function dbFindByIndex<T>(
  store: StoreNames,
  indexName: string,
  value: IDBValidKey
): Promise<T | undefined> {
  const db = await openDB()
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const idx = tx.objectStore(store).index(indexName)
    const req = idx.get(value)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** Upsert (insert or update) a single record. */
export async function dbPut<T>(store: StoreNames, record: T): Promise<T> {
  const db = await openDB()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(record)
    req.onsuccess = () => resolve(record)
    req.onerror = () => reject(req.error)
  })
}

/** Upsert multiple records in a single transaction (efficient bulk write). */
export async function dbPutAll<T>(store: StoreNames, records: T[]): Promise<void> {
  if (records.length === 0) return
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const objectStore = tx.objectStore(store)
    records.forEach(r => objectStore.put(r))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Delete a record by primary key. */
export async function dbDelete(store: StoreNames, key: string): Promise<void> {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Count all records in a store. */
export async function dbCount(store: StoreNames): Promise<number> {
  const db = await openDB()
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Clear all records from a store. */
export async function dbClear(store: StoreNames): Promise<void> {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// --------------------------------------------------------------------------
// Seed-on-first-run flag (uses localStorage just for the boolean flag)
// --------------------------------------------------------------------------
const SEED_FLAG_KEY = 'campus_connect_db_seeded_v3'

export function isDBSeeded(): boolean {
  try {
    return localStorage.getItem(SEED_FLAG_KEY) === 'true'
  } catch {
    return false
  }
}

export function markDBSeeded(): void {
  try {
    localStorage.setItem(SEED_FLAG_KEY, 'true')
  } catch {
    // ignore — data still persists in IndexedDB
  }
}

// --------------------------------------------------------------------------
// Typed convenience store accessors
// --------------------------------------------------------------------------

export const UsersDB = {
  getAll:      ()            => dbGetAll<UserProfile>('users'),
  getById:     (id: string)  => dbGet<UserProfile>('users', id),
  getByEmail:  (email: string) =>
    dbFindByIndex<UserProfile>('users', 'email', email.toLowerCase().trim()),
  save:        (user: UserProfile)           => dbPut<UserProfile>('users', user),
  saveAll:     (users: UserProfile[])        => dbPutAll<UserProfile>('users', users),
  count:       ()                            => dbCount('users'),
}

export const VenuesDB = {
  getAll:  ()           => dbGetAll<Venue>('venues'),
  getById: (id: string) => dbGet<Venue>('venues', id),
  save:    (venue: Venue)       => dbPut<Venue>('venues', venue),
  saveAll: (venues: Venue[])    => dbPutAll<Venue>('venues', venues),
  count:   ()                   => dbCount('venues'),
}

export const BookingsDB = {
  getAll:        ()                 => dbGetAll<Booking>('bookings'),
  getById:       (id: string)       => dbGet<Booking>('bookings', id),
  getByOrganizer: (organizerId: string) =>
    dbGetByIndex<Booking>('bookings', 'organizerId', organizerId),
  getByStatus:   (status: string)   =>
    dbGetByIndex<Booking>('bookings', 'status', status),
  save:          (booking: Booking) => dbPut<Booking>('bookings', booking),
  saveAll:       (bookings: Booking[]) => dbPutAll<Booking>('bookings', bookings),
  count:         ()                 => dbCount('bookings'),
}

export const NotificationsDB = {
  getAll:    ()               => dbGetAll<NotificationItem>('notifications'),
  getByUser: (userId: string) =>
    dbGetByIndex<NotificationItem>('notifications', 'userId', userId),
  save:      (notif: NotificationItem)       => dbPut<NotificationItem>('notifications', notif),
  saveAll:   (notifs: NotificationItem[])    => dbPutAll<NotificationItem>('notifications', notifs),
  delete:    (id: string)                    => dbDelete('notifications', id),
}

export const HistoryDB = {
  getAll:      ()                  => dbGetAll<BookingHistoryItem>('event_history'),
  getByBooking: (bookingId: string) =>
    dbGetByIndex<BookingHistoryItem>('event_history', 'bookingId', bookingId),
  save:        (item: BookingHistoryItem)      => dbPut<BookingHistoryItem>('event_history', item),
  saveAll:     (items: BookingHistoryItem[])   => dbPutAll<BookingHistoryItem>('event_history', items),
  count:       ()                              => dbCount('event_history'),
}

export const MaintenanceDB = {
  getAll:    ()                => dbGetAll<VenueMaintenanceBlock>('maintenance'),
  getByVenue: (venueId: string) =>
    dbGetByIndex<VenueMaintenanceBlock>('maintenance', 'venueId', venueId),
  save:      (block: VenueMaintenanceBlock)    => dbPut<VenueMaintenanceBlock>('maintenance', block),
  saveAll:   (blocks: VenueMaintenanceBlock[]) => dbPutAll<VenueMaintenanceBlock>('maintenance', blocks),
  delete:    (id: string)                      => dbDelete('maintenance', id),
  count:     ()                                => dbCount('maintenance'),
}
