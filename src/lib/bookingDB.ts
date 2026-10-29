// src/lib/bookingDB.ts
/**
 * CampusConnect – Booking Local Database
 * ======================================
 * This module provides a thin, type‑safe wrapper around IndexedDB for persisting
 * booking information on the client. It mirrors the pattern used in
 * `eventHistoryDB.ts` so the rest of the codebase can continue to import a single
 * source of truth for all persistence concerns.
 *
 * The database lives entirely in the browser (IndexedDB) and therefore survives
 * page reloads, tab closes and re‑opens – exactly what the user asked for.
 */

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import type { Booking } from '@/types';

/**
 * The IndexedDB schema for the application.
 *
 * - `bookings` – stores a record for every reservation made by a user.
 */
interface CampusConnectDB extends DBSchema {
  bookings: {
    key: string; // UUID or any unique identifier for the booking
    value: Booking;
    indexes: {
      /** Allows quick look‑up by the user that created the booking */
      userId: string;
      /** Enables range queries on the start time */
      startTime: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CampusConnectDB>> | null = null;

/**
 * Initialise (or retrieve) the IndexedDB instance.  The function is idempotent –
 * subsequent calls simply return the existing connection.
 */
export async function getBookingDB(): Promise<IDBPDatabase<CampusConnectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CampusConnectDB>('CampusConnect_v3', 1, {
      upgrade(database) {
        const store = database.createObjectStore('bookings', {
          keyPath: 'id',
          autoIncrement: false,
        });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('startTime', 'startTime', { unique: false });
      },
    });
  }
  return dbPromise;
}

/** ---------------------------------------------------------------------------
 * CRUD helpers – each returns a Promise so callers can `await` them.
 * --------------------------------------------------------------------------- */

/** Insert a new booking record. */
export async function addBooking(booking: Booking): Promise<void> {
  const db = await getBookingDB();
  await db.add('bookings', booking);
}

/** Fetch a single booking by its primary key. */
export async function getBooking(id: string): Promise<Booking | undefined> {
  const db = await getBookingDB();
  return db.get('bookings', id);
}

/** Return all bookings, optionally filtered by user. */
export async function getAllBookings(userId?: string): Promise<Booking[]> {
  const db = await getBookingDB();
  if (userId) {
    return db.getAllFromIndex('bookings', 'userId', IDBKeyRange.only(userId));
  }
  return db.getAll('bookings');
}

/** Update an existing booking – merges the passed partial data with the stored record. */
export async function updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
  const db = await getBookingDB();
  const existing = await db.get('bookings', id);
  if (!existing) throw new Error(`Booking with id ${id} not found`);
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() } as Booking;
  await db.put('bookings', merged);
}

/** Remove a booking from the store. */
export async function deleteBooking(id: string): Promise<void> {
  const db = await getBookingDB();
  await db.delete('bookings', id);
}

/** ---------------------------------------------------------------------------
 * Utility – export the whole bookings table as JSON (useful for debugging or
 * manual backup). The result can be saved to a file or sent to a server.
 * --------------------------------------------------------------------------- */
export async function exportBookingsToJSON(): Promise<string> {
  const all = await getAllBookings();
  return JSON.stringify(all, null, 2);
}

/** ---------------------------------------------------------------------------
 * Types – keep them in a central location (`src/types/index.ts`). A minimal
 * definition is provided below for reference; adjust it to your exact domain.
 * --------------------------------------------------------------------------- */
/*
export interface Booking {
  id: string;               // primary key – UUID
  userId: string;           // reference to the user who created the booking
  eventId: string;          // which campus event is being booked
  startTime: number;        // epoch ms – convenient for range queries
  endTime: number;          // epoch ms
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;        // ISO timestamp
  updatedAt?: string;       // ISO timestamp – optional until first update
  // ...any additional fields your product requires
}
*/

// End of bookingDB.ts

