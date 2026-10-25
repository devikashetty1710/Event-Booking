import { BookingHistoryItem } from '@/types'
import { INITIAL_HISTORY } from './demoData'
import { supabase, isSupabaseConfigured } from './supabase'
import { localStore } from './storage'

const DB_NAME = 'NMIT_CampusConnect_EventDB_v2'
const DB_VERSION = 1
const STORE_NAME = 'event_history'

/**
 * Checks whether IndexedDB is available in the current browser environment.
 */
function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

/**
 * Opens and initializes the IndexedDB database instance with appropriate schema & indices.
 */
function openEventHistoryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not supported in this browser environment.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('bookingId', 'bookingId', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('actionType', 'actionType', { unique: false })
        store.createIndex('changedBy', 'changedBy', { unique: false })
        store.createIndex('newStatus', 'newStatus', { unique: false })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      resolve(db)
    }

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB database.'))
    }
  })
}

/**
 * Seeds initial event history items into IndexedDB if database is freshly created.
 */
let isDatabaseSeeded = false

export async function initializeEventHistoryDB(): Promise<void> {
  if (isDatabaseSeeded || !isIndexedDBAvailable()) return

  try {
    const db = await openEventHistoryDatabase()
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const countReq = store.count()
      countReq.onsuccess = () => resolve(countReq.result)
      countReq.onerror = () => reject(countReq.error)
    })

    if (count === 0) {
      // Seed with INITIAL_HISTORY
      const seedItems = localStore.getHistory() || INITIAL_HISTORY
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      for (const item of seedItems) {
        store.put(item)
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    }
    isDatabaseSeeded = true
  } catch (err) {
    console.warn('IndexedDB initial seed skipped/error:', err)
  }
}

/**
 * Persists an event history record to IndexedDB, localStorage fallback, and Supabase (if linked).
 */
export async function recordEventHistory(entry: BookingHistoryItem): Promise<BookingHistoryItem> {
  // 1. Sync to in-memory / localStorage cache
  const localList = localStore.getHistory()
  const filtered = localList.filter(h => h.id !== entry.id)
  filtered.unshift(entry)
  localStore.saveHistory(filtered)

  // 2. Persist to browser's transactional IndexedDB database
  if (isIndexedDBAvailable()) {
    try {
      const db = await openEventHistoryDatabase()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.put(entry)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (idbErr) {
      console.warn('IndexedDB write error, saved to LocalStore:', idbErr)
    }
  }

  // 3. Persist to remote Supabase DB if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('booking_history').insert({
        id: entry.id,
        booking_id: entry.bookingId,
        previous_status: entry.previousStatus,
        new_status: entry.newStatus,
        changed_by: entry.changedBy,
        changed_by_name: entry.changedByName,
        comments: entry.comments,
        created_at: entry.createdAt
      })
    } catch (supaErr) {
      console.warn('Supabase remote history insertion skipped:', supaErr)
    }
  }

  return entry
}

/**
 * Fetches all event history records specifically for a given booking ID.
 */
export async function fetchEventHistoryByBookingId(bookingId: string): Promise<BookingHistoryItem[]> {
  await initializeEventHistoryDB()

  if (isIndexedDBAvailable()) {
    try {
      const db = await openEventHistoryDatabase()
      const items = await new Promise<BookingHistoryItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const index = store.index('bookingId')
        const req = index.getAll(bookingId)
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      })

      if (items.length > 0) {
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    } catch (e) {
      console.warn('IndexedDB read by booking ID failed, falling back:', e)
    }
  }

  // Fallback to localStore
  const all = localStore.getHistory()
  return all
    .filter(h => h.bookingId === bookingId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Fetches all event history audit records stored in the database.
 */
export async function fetchAllEventHistory(): Promise<BookingHistoryItem[]> {
  await initializeEventHistoryDB()

  if (isIndexedDBAvailable()) {
    try {
      const db = await openEventHistoryDatabase()
      const items = await new Promise<BookingHistoryItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      })

      if (items.length > 0) {
        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    } catch (e) {
      console.warn('IndexedDB read all failed, falling back to LocalStore:', e)
    }
  }

  return localStore.getHistory().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Clears the Event History Database table and re-initializes.
 */
export async function clearEventHistoryDB(): Promise<void> {
  localStore.saveHistory([])

  if (isIndexedDBAvailable()) {
    try {
      const db = await openEventHistoryDatabase()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        const req = store.clear()
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch (e) {
      console.warn('IndexedDB clear error:', e)
    }
  }
}

/**
 * Exports all database records formatted as JSON string.
 */
export async function exportEventHistoryToJSON(): Promise<string> {
  const records = await fetchAllEventHistory()
  return JSON.stringify(records, null, 2)
}

/**
 * Exports all database records formatted as CSV string for reporting/auditing.
 */
export async function exportEventHistoryToCSV(): Promise<string> {
  const records = await fetchAllEventHistory()
  const headers = ['ID', 'Booking ID', 'Event Title', 'Venue', 'Previous Status', 'New Status', 'Action Type', 'Changed By', 'Role', 'Comments', 'Timestamp (UTC)']
  
  const escapeCsv = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`

  const rows = records.map(r => [
    escapeCsv(r.id),
    escapeCsv(r.bookingId),
    escapeCsv(r.eventTitle),
    escapeCsv(r.venueName),
    escapeCsv(r.previousStatus),
    escapeCsv(r.newStatus),
    escapeCsv(r.actionType || 'Status Change'),
    escapeCsv(r.changedByName),
    escapeCsv(r.changedByRole || 'user'),
    escapeCsv(r.comments),
    escapeCsv(r.createdAt)
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Returns diagnostic metadata about the current database connection and storage status.
 */
export async function getDatabaseDiagnostics(): Promise<{
  databaseName: string
  tableName: string
  totalRecords: number
  primaryEngine: 'IndexedDB (Browser Database)' | 'LocalStorage'
  isRemoteSyncConfigured: boolean
  isIndexedDBSupported: boolean
  lastCheckedAt: string
}> {
  const isIdb = isIndexedDBAvailable()
  const allRecords = await fetchAllEventHistory()

  return {
    databaseName: DB_NAME,
    tableName: STORE_NAME,
    totalRecords: allRecords.length,
    primaryEngine: isIdb ? 'IndexedDB (Browser Database)' : 'LocalStorage',
    isRemoteSyncConfigured: isSupabaseConfigured,
    isIndexedDBSupported: isIdb,
    lastCheckedAt: new Date().toISOString()
  }
}
