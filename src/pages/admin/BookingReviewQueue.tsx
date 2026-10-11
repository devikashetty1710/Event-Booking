import React, { useState, useMemo } from 'react'
import { Booking, Venue, BookingStatus } from '@/types'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { formatDateIST, formatTimeIST, getStatusBadgeProps, getCategoryBadgeProps } from '@/lib/utils'
import { approveBookingTransactional, rejectBooking, reassignBooking, fetchBookingHistory } from '@/lib/storage'
import { checkVenueAvailability } from '@/lib/recommendations'
import { useAuth } from '@/context/AuthContext'
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  AlertCircle, 
  Clock, 
  Building2, 
  User, 
  Calendar, 
  Users, 
  FileText, 
  Send,
  Eye,
  History,
  ShieldCheck,
  ArrowRight
} from 'lucide-react'

interface BookingReviewQueueProps {
  bookings: Booking[]
  venues: Venue[]
}

export const BookingReviewQueue: React.FC<BookingReviewQueueProps> = ({
  bookings,
  venues
}) => {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Pending Approval')
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)

  // Action states
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedAlternativeVenueId, setSelectedAlternativeVenueId] = useState('')
  const [reassignReason, setReassignReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingHistoryList, setBookingHistoryList] = useState<any[]>([])

  const venueMap = useMemo(() => {
    const map = new Map<string, Venue>()
    venues.forEach(v => map.set(v.id, v))
    return map
  }, [venues])

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesRef = b.referenceCode.toLowerCase().includes(term)
        const matchesTitle = b.eventTitle.toLowerCase().includes(term)
        const matchesOrg = b.organizerName.toLowerCase().includes(term)
        const matchesDept = b.department.toLowerCase().includes(term)
        if (!matchesRef && !matchesTitle && !matchesOrg && !matchesDept) return false
      }

      return true
    })
  }, [bookings, statusFilter, searchTerm])

  const openReviewModal = async (booking: Booking) => {
    setActiveBooking(booking)
    setReviewNotes(booking.reviewNotes || '')
    setRejectionReason('')
    setSelectedAlternativeVenueId(booking.assignedVenueId || booking.requestedVenueId)
    setReassignReason('')
    setActionError(null)

    // Load history
    const history = await fetchBookingHistory(booking.id)
    setBookingHistoryList(history)
  }

  // Real-time conflict recheck for the active booking
  const conflictCheck = useMemo(() => {
    if (!activeBooking) return { isAvailable: true }
    const targetVenueId = selectedAlternativeVenueId || activeBooking.requestedVenueId
    return checkVenueAvailability(
      targetVenueId,
      activeBooking.requestedDate,
      activeBooking.requestedStart,
      activeBooking.requestedEnd,
      15,
      15,
      bookings,
      activeBooking.id // exclude self
    )
  }, [activeBooking, selectedAlternativeVenueId, bookings])

  const handleApprove = async () => {
    if (!activeBooking || !currentUser) return
    setIsProcessing(true)
    setActionError(null)

    const targetVenueId = selectedAlternativeVenueId || activeBooking.requestedVenueId

    const res = await approveBookingTransactional({
      bookingId: activeBooking.id,
      assignedVenueId: targetVenueId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      reviewNotes: reviewNotes || 'Approved by Campus Administration.'
    })

    setIsProcessing(false)

    if (res.success) {
      setActiveBooking(null)
    } else {
      setActionError(res.error || 'Conflict detected during transaction.')
    }
  }

  const handleReject = async () => {
    if (!activeBooking || !currentUser) return
    if (!rejectionReason.trim()) {
      setActionError('A mandatory rejection reason must be supplied to the organizer.')
      return
    }

    setIsProcessing(true)
    setActionError(null)

    const res = await rejectBooking({
      bookingId: activeBooking.id,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      rejectionReason: rejectionReason.trim()
    })

    setIsProcessing(false)

    if (res.success) {
      setActiveBooking(null)
    } else {
      setActionError(res.error || 'Failed to reject booking.')
    }
  }

  const handleReassign = async () => {
    if (!activeBooking || !currentUser) return
    if (!reassignReason.trim()) {
      setActionError('Please specify the reason for reassigning to a different venue.')
      return
    }

    setIsProcessing(true)
    setActionError(null)

    const res = await reassignBooking({
      bookingId: activeBooking.id,
      newVenueId: selectedAlternativeVenueId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      reason: reassignReason.trim()
    })

    setIsProcessing(false)

    if (res.success) {
      setActiveBooking(null)
    } else {
      setActionError(res.error || 'Failed to reassign venue.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Booking Requests Review Queue
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review').length} Awaiting Review
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Perform administrative clearance, verify AV requirements, check for concurrency conflicts, or reassign venues.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event title, organizer, department, or reference code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses ({bookings.length})</option>
              <option value="Pending Approval">Pending Approval Only</option>
              <option value="Under Review">Under Review Only</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review Queue List */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          No booking requests match the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const venue = venueMap.get(b.requestedVenueId)
            const assignedVenue = venueMap.get(b.assignedVenueId || '')
            const statusProps = getStatusBadgeProps(b.status)
            const categoryProps = getCategoryBadgeProps(b.eventCategory)

            return (
              <Card key={b.id} hoverable className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusProps.variant} showDot>
                        {statusProps.label}
                      </Badge>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor}`}>
                        {categoryProps.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {b.referenceCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {b.eventTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        {venue?.name} {assignedVenue && assignedVenue.id !== venue?.id ? `→ Assigned: ${assignedVenue.name}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {formatDateIST(b.requestedDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {formatTimeIST(b.requestedStart)} - {formatTimeIST(b.requestedEnd)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        {b.expectedAttendees} Attendees
                      </span>
                      <span className="text-slate-500">
                        • {b.organizerName} ({b.department})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <button
                      onClick={() => openReviewModal(b)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review & Clear
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Review & Clearance Modal */}
      {activeBooking && (
        <Modal
          isOpen={!!activeBooking}
          onClose={() => setActiveBooking(null)}
          title={`Administrative Review: ${activeBooking.eventTitle}`}
          description={`Ref: ${activeBooking.referenceCode} • Organizer: ${activeBooking.organizerName}`}
          maxWidth="3xl"
        >
          <div className="space-y-5">
            {/* Real-time Server Concurrency Warning if conflict exists */}
            {!conflictCheck.isAvailable ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Scheduling Overlap Warning:</strong>
                  {conflictCheck.reason}. You cannot approve this booking unless you assign a different venue or adjust the time slot.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Safe to Approve:</strong> Venue slot is 100% free of conflicts (including reserved setup/cleanup buffers).
                </span>
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-900 font-semibold">
                {actionError}
              </div>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Requested Date & Timings</span>
                <span className="font-bold text-slate-900">
                  {formatDateIST(activeBooking.requestedDate)} • {formatTimeIST(activeBooking.requestedStart)} - {formatTimeIST(activeBooking.requestedEnd)}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Buffers: Setup from {formatTimeIST(activeBooking.setupStart || activeBooking.requestedStart)}, Cleanup till {formatTimeIST(activeBooking.cleanupEnd || activeBooking.requestedEnd)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Expected Audience</span>
                <span className="font-bold text-slate-900">
                  {activeBooking.expectedAttendees} Attendees
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Organizer Contact</span>
                <span className="font-bold text-slate-900">{activeBooking.organizerName}</span>
                <span className="block text-[10px] text-slate-500">{activeBooking.organizerEmail} • {activeBooking.organizerPhone}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Department / Club</span>
                <span className="font-bold text-slate-900">{activeBooking.department}</span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500 block text-[11px]">Event Purpose</span>
                <p className="text-slate-700 leading-relaxed mt-0.5">{activeBooking.eventDescription}</p>
              </div>
            </div>

            {/* Equipment Requested */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Requested Equipment Checklist
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeBooking.equipment.map((eq, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      eq.isMandatory
                        ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {eq.name} {eq.isMandatory ? '(Mandatory)' : '(Optional)'}
                  </span>
                ))}
              </div>
            </div>

            {/* Reassign / Choose Venue dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Assigned Venue Selection
              </label>
              <select
                value={selectedAlternativeVenueId}
                onChange={(e) => setSelectedAlternativeVenueId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              >
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.block}) — Max {v.maxCapacity} Seats {!v.isDemoVenue ? '★ Real' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Review Notes & Rejection input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Approval Notes / AV Clearance Comments
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Cleared by Dean. Technical sound technician assigned."
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">
                  Mandatory Rejection Reason (If Declining)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Schedule clash with University Academic Senate meeting. Please select Phalguni Hall."
                  className="w-full p-2.5 text-xs rounded-lg border border-rose-200 bg-rose-50/20"
                />
              </div>
            </div>

            {/* Booking Audit History */}
            {bookingHistoryList.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Audit History
                </span>
                <div className="space-y-1 text-[11px] text-slate-600">
                  {bookingHistoryList.map(h => (
                    <div key={h.id} className="flex items-center justify-between bg-slate-50 p-1.5 rounded">
                      <span><strong>{h.changedByName}:</strong> {h.comments}</span>
                      <span className="text-slate-400">{formatDateIST(h.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setActiveBooking(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-2xs"
                >
                  Reject Request
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !conflictCheck.isAvailable}
                  className={`px-5 py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 ${
                    conflictCheck.isAvailable
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Validating...' : 'Approve & Confirm Reservation'}</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
