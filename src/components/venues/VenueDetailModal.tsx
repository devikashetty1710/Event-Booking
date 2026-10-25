import React from 'react'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'
import { Venue, Booking } from '@/types'
import { formatDateIST, formatTimeIST } from '@/lib/utils'
import { 
  Building2, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react'

interface VenueDetailModalProps {
  isOpen: boolean
  onClose: () => void
  venue: Venue | null
  upcomingBookings: Booking[]
  onBookVenue?: (venueId: string) => void
}

export const VenueDetailModal: React.FC<VenueDetailModalProps> = ({
  isOpen,
  onClose,
  venue,
  upcomingBookings,
  onBookVenue
}) => {
  if (!venue) return null

  // Filter bookings for this venue
  const venueBookings = upcomingBookings.filter(
    b => (b.assignedVenueId || b.requestedVenueId) === venue.id && b.status === 'Approved'
  ).slice(0, 5)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={venue.name}
      description={`${venue.block} • ${venue.venueType}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Clean Info Header (No Photos) */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-800 text-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              {venue.block} • {venue.venueType}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
              NMAMIT Campus Venue
            </span>
          </div>
          <h3 className="text-xl font-bold font-heading">{venue.name}</h3>
          <p className="text-xs text-indigo-200 mt-1">{venue.locationNotes || venue.block}</p>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            {venue.description}
          </p>
        </div>

        {/* Capacity & Timings Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Capacity Range</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {venue.minCapacity} – {venue.maxCapacity}
            </span>
            <span className="text-[10px] text-indigo-600">Max {venue.maxCapacity} Seats</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Recommended</span>
            <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
              {venue.recommendedCapacity} Seats
            </span>
            <span className="text-[10px] text-slate-500">Optimum Airflow</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Operating Hours</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {venue.operatingHours.start} - {venue.operatingHours.end}
            </span>
            <span className="text-[10px] text-slate-500">Daily Slots</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Status</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {venue.maintenanceStatus === 'normal' ? 'Operational' : 'Maintenance'}
            </span>
            <span className="text-[10px] text-slate-500">Approval Required</span>
          </div>
        </div>

        {/* Equipment & Facilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Equipped Hardware & AV
            </h4>
            <div className="space-y-1.5">
              {venue.equipment.map((eq, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{eq}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Venue Facilities & Features
            </h4>
            <div className="space-y-1.5">
              {venue.facilities.map((fac, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
              {venue.accessibilityFeatures.map((acc, i) => (
                <div key={`acc-${i}`} className="flex items-center gap-2 text-xs text-teal-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{acc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Confirmed Reservations */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Upcoming Confirmed Bookings in this Venue
          </h4>
          {venueBookings.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
              No upcoming reservations currently scheduled. This venue is completely open.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {venueBookings.map((b) => (
                <div key={b.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{b.eventTitle}</span>
                    <span className="text-[11px] text-slate-500">{b.organizerName} • {b.department}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-medium text-indigo-700 block">{formatDateIST(b.requestedDate)}</span>
                    <span className="text-[10px] text-slate-500">{formatTimeIST(b.requestedStart)} - {formatTimeIST(b.requestedEnd)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          {onBookVenue && (
            <button
              onClick={() => {
                onClose()
                onBookVenue(venue.id)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <span>Book This Venue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
