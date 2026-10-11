import React from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { Booking, Venue } from '@/types'
import { formatDateIST, formatTimeIST, getStatusBadgeProps, getCategoryBadgeProps, generateIcsFile, downloadFile } from '@/lib/utils'
import { Calendar, Clock, MapPin, Users, User, Download, QrCode, FileText, CheckCircle2 } from 'lucide-react'

interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  venue: Venue | null
  onOpenQr?: (booking: Booking) => void
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  venue,
  onOpenQr
}) => {
  if (!booking) return null

  const statusProps = getStatusBadgeProps(booking.status)
  const categoryProps = getCategoryBadgeProps(booking.eventCategory)
  const venueName = venue?.name || 'Assigned Campus Venue'

  const handleExportIcs = () => {
    const icsContent = generateIcsFile(booking, venueName)
    const filename = `${booking.eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
    downloadFile(icsContent, filename, 'text/calendar;charset=utf-8')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={booking.eventTitle}
      description={`Reference ID: ${booking.referenceCode}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Badges bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusProps.variant} showDot>
            {statusProps.label}
          </Badge>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor}`}>
            {categoryProps.label}
          </span>
          <span className="text-xs text-slate-500 font-medium capitalize">
            {booking.visibility.replace('_', ' ')} Event
          </span>
        </div>

        {/* Core Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-start gap-2.5 text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-[11px]">Event Date</span>
              <span className="font-semibold text-slate-900">{formatDateIST(booking.requestedDate)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-[11px]">Session Timings</span>
              <span className="font-semibold text-slate-900">
                {formatTimeIST(booking.requestedStart)} - {formatTimeIST(booking.requestedEnd)}
              </span>
              {booking.setupStart && (
                <span className="block text-[10px] text-slate-500">
                  (Setup buffer from {formatTimeIST(booking.setupStart)})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-[11px]">Venue & Location</span>
              <span className="font-semibold text-slate-900">{venueName}</span>
              {venue && <span className="block text-[10px] text-slate-500">{venue.block}</span>}
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-700">
            <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-[11px]">Expected Audience</span>
              <span className="font-semibold text-slate-900">{booking.expectedAttendees} Attendees</span>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-start gap-2.5 text-slate-700 pt-2 border-t border-slate-200/80">
            <User className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 block text-[11px]">Organizer</span>
              <span className="font-semibold text-slate-900">{booking.organizerName}</span>
              <span className="text-slate-500"> • {booking.department}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Event Purpose & Summary
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
            {booking.eventDescription}
          </p>
        </div>

        {/* Equipment Requested */}
        {booking.equipment && booking.equipment.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Approved Equipment & AV Facilities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {booking.equipment.map((eq, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {eq.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review notes if any */}
        {booking.reviewNotes && (
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
            <span className="font-bold block text-[11px] text-indigo-950 mb-0.5">Campus Administration Clearance:</span>
            {booking.reviewNotes}
            {booking.reviewedByName && (
              <span className="block text-[10px] text-indigo-700 mt-1">
                — Reviewed by {booking.reviewedByName} ({formatDateIST(booking.reviewedAt || '')})
              </span>
            )}
          </div>
        )}

        {/* Actions bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {booking.status === 'Approved' && (
              <>
                <button
                  onClick={handleExportIcs}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs border border-indigo-200 transition-colors shadow-2xs"
                  title="Export to iCalendar (.ics)"
                >
                  <Download className="w-3.5 h-3.5" />
                  Add to Calendar (.ics)
                </button>
                {onOpenQr && (
                  <button
                    onClick={() => {
                      onClose()
                      onOpenQr(booking)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs border border-slate-200 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Pass
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
