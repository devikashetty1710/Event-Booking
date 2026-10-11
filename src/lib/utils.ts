import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Booking, BookingStatus, EventCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let random = ''
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const year = new Date().getFullYear()
  return `NMAMIT-${year}-${random}`
}

export function generateCheckInToken(bookingId: string): string {
  return `TOKEN_${bookingId.substring(0, 8)}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}

export function formatDateIST(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export function formatTimeIST(timeStr: string): string {
  if (!timeStr) return ''
  // If timeStr is HH:mm:
  if (timeStr.length === 5 && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 === 0 ? 12 : h % 12
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`
  }
  try {
    const d = new Date(timeStr)
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return timeStr
  }
}

export function formatDateTimeIST(dateStr: string, timeStr: string): string {
  return `${formatDateIST(dateStr)} at ${formatTimeIST(timeStr)}`
}

export function getStatusBadgeProps(status: BookingStatus): {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'
  label: string
  bgClass: string
  textClass: string
  borderClass: string
} {
  switch (status) {
    case 'Approved':
      return {
        variant: 'success',
        label: 'Approved',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200'
      }
    case 'Pending Approval':
      return {
        variant: 'warning',
        label: 'Pending Approval',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200'
      }
    case 'Under Review':
      return {
        variant: 'info',
        label: 'Under Review',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-700',
        borderClass: 'border-blue-200'
      }
    case 'Rejected':
      return {
        variant: 'danger',
        label: 'Rejected',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-700',
        borderClass: 'border-rose-200'
      }
    case 'Cancelled':
      return {
        variant: 'secondary',
        label: 'Cancelled',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-600',
        borderClass: 'border-slate-200'
      }
    case 'Completed':
      return {
        variant: 'secondary',
        label: 'Completed',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200'
      }
    case 'Draft':
    default:
      return {
        variant: 'secondary',
        label: 'Draft',
        bgClass: 'bg-slate-50',
        textClass: 'text-slate-600',
        borderClass: 'border-slate-200'
      }
  }
}

export function getCategoryBadgeProps(category: EventCategory): {
  color: string
  label: string
  textColor: string
  borderColor: string
} {
  switch (category) {
    case 'seminar':
      return { color: 'bg-indigo-100', textColor: 'text-indigo-800', borderColor: 'border-indigo-300', label: 'Seminar' }
    case 'workshop':
      return { color: 'bg-teal-100', textColor: 'text-teal-800', borderColor: 'border-teal-300', label: 'Workshop' }
    case 'conference':
      return { color: 'bg-sky-100', textColor: 'text-sky-800', borderColor: 'border-sky-300', label: 'Conference' }
    case 'club_activity':
      return { color: 'bg-emerald-100', textColor: 'text-emerald-800', borderColor: 'border-emerald-300', label: 'Club Activity' }
    case 'cultural_event':
      return { color: 'bg-fuchsia-100', textColor: 'text-fuchsia-800', borderColor: 'border-fuchsia-300', label: 'Cultural' }
    case 'technical_event':
      return { color: 'bg-amber-100', textColor: 'text-amber-800', borderColor: 'border-amber-300', label: 'Technical' }
    case 'guest_lecture':
      return { color: 'bg-cyan-100', textColor: 'text-cyan-800', borderColor: 'border-cyan-300', label: 'Guest Lecture' }
    case 'meeting':
      return { color: 'bg-slate-100', textColor: 'text-slate-800', borderColor: 'border-slate-300', label: 'Meeting' }
    default:
      return { color: 'bg-violet-100', textColor: 'text-violet-800', borderColor: 'border-violet-300', label: 'Other Event' }
  }
}

/**
 * Generate an .ics calendar file content for standard import into Google Calendar, Outlook, or Apple Calendar.
 */
export function generateIcsFile(booking: Booking, venueName: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateParts = booking.requestedDate.split('-').map(Number)
  const [startH, startM] = (booking.requestedStart.includes(':') ? booking.requestedStart.split(':') : ['09', '00']).map(Number)
  const [endH, endM] = (booking.requestedEnd.includes(':') ? booking.requestedEnd.split(':') : ['17', '00']).map(Number)

  // Construct UTC representation or local representation
  const dtStart = `${dateParts[0]}${pad(dateParts[1])}${pad(dateParts[2])}T${pad(startH)}${pad(startM)}00`
  const dtEnd = `${dateParts[0]}${pad(dateParts[1])}${pad(dateParts[2])}T${pad(endH)}${pad(endM)}00`
  const now = new Date()
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NMAMIT Nitte//CampusConnect Event System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.referenceCode}@campusconnect.nmamit.in`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
    `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
    `SUMMARY:${booking.eventTitle}`,
    `DESCRIPTION:${booking.eventDescription.replace(/\n/g, '\\n')} (Ref: ${booking.referenceCode})`,
    `LOCATION:${venueName}, NMAMIT Nitte`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/calendar;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
