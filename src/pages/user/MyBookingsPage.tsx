import React, { useState, useMemo } from 'react'
import { Booking, Venue, BookingStatus } from '@/types'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { EventDetailModal } from '@/components/calendar/EventDetailModal'
import { QrCodeModal } from '@/components/common/QrCodeModal'
import { formatDateIST, formatTimeIST, getStatusBadgeProps, getCategoryBadgeProps, generateIcsFile, downloadFile } from '@/lib/utils'
import { cancelBooking } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  QrCode, 
  Eye, 
  XCircle, 
  RotateCcw, 
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react'

interface MyBookingsPageProps {
  bookings: Booking[]
  venues: Venue[]
  onReviseBooking: (booking: Booking) => void
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  bookings,
  venues,
  onReviseBooking
}) => {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals state
  const [activeDetailBooking, setActiveDetailBooking] = useState<Booking | null>(null)
  const [activeQrBooking, setActiveQrBooking] = useState<Booking | null>(null)
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const venueMap = useMemo(() => {
    const map = new Map<string, Venue>()
    venues.forEach(v => map.set(v.id, v))
    return map
  }, [venues])

  // Filter bookings: user's own bookings or all if in demo mode
  const userBookings = useMemo(() => {
    return bookings.filter(b => {
      // In demo mode, if currentUser matches organizer or user has created bookings
      if (statusFilter !== 'all' && b.status !== statusFilter) return false

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesRef = b.referenceCode.toLowerCase().includes(term)
        const matchesTitle = b.eventTitle.toLowerCase().includes(term)
        const venue = venueMap.get(b.assignedVenueId || b.requestedVenueId)
        const matchesVenue = venue?.name.toLowerCase().includes(term)
        if (!matchesRef && !matchesTitle && !matchesVenue) return false
      }

      return true
    })
  }, [bookings, statusFilter, searchTerm, venueMap])

  const handleExportIcs = (booking: Booking) => {
    const venue = venueMap.get(booking.assignedVenueId || booking.requestedVenueId)
    const content = generateIcsFile(booking, venue?.name || 'NMAMIT Venue')
    downloadFile(content, `${booking.referenceCode}.ics`)
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking || !currentUser) return
    setIsCancelling(true)
    await cancelBooking({
      bookingId: cancelModalBooking.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      reason: cancelReason || 'Cancelled by organizer.'
    })
    setIsCancelling(false)
    setCancelModalBooking(null)
    setCancelReason('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
          My Event Reservations & Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track administrator clearance status, download calendar passes, or adjust your requested sessions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by reference code (NMAMIT-2026-...), event title, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses ({bookings.length})</option>
              <option value="Approved">Approved</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Under Review">Under Review</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {userBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          No bookings match your current search or filter.
        </div>
      ) : (
        <div className="space-y-3">
          {userBookings.map((b) => {
            const venue = venueMap.get(b.assignedVenueId || b.requestedVenueId)
            const statusProps = getStatusBadgeProps(b.status)
            const categoryProps = getCategoryBadgeProps(b.eventCategory)

            return (
              <Card key={b.id} hoverable className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Info & Status */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusProps.variant} showDot>
                        {statusProps.label}
                      </Badge>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor}`}>
                        {categoryProps.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {b.referenceCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {b.eventTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        {venue?.name} ({venue?.block})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {formatDateIST(b.requestedDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {formatTimeIST(b.requestedStart)} - {formatTimeIST(b.requestedEnd)}
                      </span>
                    </div>

                    {/* Rejection / Review Feedback */}
                    {b.status === 'Rejected' && b.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Reason for Rejection:</strong> {b.rejectionReason}
                        </div>
                      </div>
                    )}

                    {b.status === 'Approved' && b.reviewNotes && (
                      <div className="text-[11px] text-emerald-800 font-medium">
                        ✓ Administration Clearance: {b.reviewNotes}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <button
                      onClick={() => setActiveDetailBooking(b)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      title="View Event Specifications"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>

                    {b.status === 'Approved' && (
                      <>
                        <button
                          onClick={() => handleExportIcs(b)}
                          className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs border border-indigo-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="Download Calendar (.ics) file"
                        >
                          <Download className="w-3.5 h-3.5" />
                          .ics
                        </button>
                        <button
                          onClick={() => setActiveQrBooking(b)}
                          className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="View QR Check-in Pass"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR Pass
                        </button>
                      </>
                    )}

                    {b.status === 'Rejected' && (
                      <button
                        onClick={() => onReviseBooking(b)}
                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revise Request
                      </button>
                    )}

                    {(b.status === 'Pending Approval' || b.status === 'Under Review' || b.status === 'Approved') && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <EventDetailModal
        isOpen={!!activeDetailBooking}
        onClose={() => setActiveDetailBooking(null)}
        booking={activeDetailBooking}
        venue={activeDetailBooking ? venueMap.get(activeDetailBooking.assignedVenueId || activeDetailBooking.requestedVenueId) || null : null}
        onOpenQr={(b) => setActiveQrBooking(b)}
      />

      {/* QR Modal */}
      <QrCodeModal
        isOpen={!!activeQrBooking}
        onClose={() => setActiveQrBooking(null)}
        booking={activeQrBooking}
        venueName={activeQrBooking ? venueMap.get(activeQrBooking.assignedVenueId || activeQrBooking.requestedVenueId)?.name || 'Venue' : 'Venue'}
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title="Cancel Booking Request"
        description={`Are you sure you want to cancel ${cancelModalBooking?.referenceCode}?`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Cancelling will release the allocated venue time slot back onto the campus calendar for other organizers.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Guest speaker flight rescheduled, or department meeting postponed..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
