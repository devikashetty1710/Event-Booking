/**
 * CampusConnect - Event History DB
 * =================================
 * Delegates to the unified IndexedDB layer (db.ts → HistoryDB).
 * This module is kept for backward compatibility with imports throughout the codebase.
 */

import { BookingHistoryItem } from '@/types'
import { HistoryDB, openDB } from './db'

// Re-export a no-op init (db.ts handles schema creation)
export async function initializeEventHistoryDB(): Promise<void> {
  await openDB()
}

/**
 * Persists an event history record to IndexedDB.
 */
export async function recordEventHistory(entry: BookingHistoryItem): Promise<BookingHistoryItem> {
  await HistoryDB.save(entry)
  return entry
}

/**
 * Fetches all event history records for a given booking ID.
 */
export async function fetchEventHistoryByBookingId(bookingId: string): Promise<BookingHistoryItem[]> {
  const items = await HistoryDB.getByBooking(bookingId)
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Fetches all event history audit records.
 */
export async function fetchAllEventHistory(): Promise<BookingHistoryItem[]> {
  const items = await HistoryDB.getAll()
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Clears the Event History store.
 */
export async function clearEventHistoryDB(): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('event_history', 'readwrite')
    const req = tx.objectStore('event_history').clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
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
 * Returns diagnostic metadata about the current database.
 */
export async function getDatabaseDiagnostics(): Promise<{
  databaseName: string
  tableName: string
  totalRecords: number
  primaryEngine: 'IndexedDB (Browser Database)'
  isRemoteSyncConfigured: boolean
  isIndexedDBSupported: boolean
  lastCheckedAt: string
}> {
  const allRecords = await fetchAllEventHistory()

  return {
    databaseName: 'CampusConnect_v3',
    tableName: 'event_history',
    totalRecords: allRecords.length,
    primaryEngine: 'IndexedDB (Browser Database)',
    isRemoteSyncConfigured: false,
    isIndexedDBSupported: typeof window !== 'undefined' && 'indexedDB' in window,
    lastCheckedAt: new Date().toISOString()
  }
}
