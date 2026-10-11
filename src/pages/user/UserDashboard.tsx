import React from 'react'
import { Booking, Venue } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { formatDateIST, formatTimeIST, getStatusBadgeProps, getCategoryBadgeProps } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  PlusCircle, 
  BookMarked, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  Layers,
  School,
  ChevronRight
} from 'lucide-react'

interface UserDashboardProps {
  bookings: Booking[]
  venues: Venue[]
  onNavigate: (tab: string, params?: { venueId?: string }) => void
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  bookings,
  venues,
  onNavigate
}) => {
  // Compute user metrics
  const approvedBookings = bookings.filter(b => b.status === 'Approved')
  const pendingRequests = bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review')
  const todayStr = new Date().toISOString().split('T')[0]
  const todayEvents = approvedBookings.filter(b => b.requestedDate === todayStr)
  const upcomingApproved = approvedBookings
    .filter(b => b.requestedDate >= todayStr)
    .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate))
    .slice(0, 4)

  const venueMap = new Map<string, Venue>()
  venues.forEach(v => venueMap.set(v.id, v))

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-200 border border-white/10 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            NMAMIT Campus Facilities Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight mb-2">
            One Campus. One Calendar. Smarter Events.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Discover bookable seminar halls and auditoriums, request reservations, view real-time availability, and coordinate seamless campus events without spreadsheet chaos.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('book-venue')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              Book a Venue Now
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Explore Campus Calendar
            </button>
            <button
              onClick={() => onNavigate('venues')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Venue Directory
            </button>
          </div>
        </div>

        {/* Decorative corner illustration */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Campus Venues</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {venues.filter(v => v.isActive).length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            4 Verified NMAMIT Halls
          </span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Upcoming Approved Events</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {approvedBookings.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Scheduled onto master calendar
          </span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Admin Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            Under administrative review
          </span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Events Happening Today</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {todayEvents.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {todayEvents.length > 0 ? 'Active in campus halls' : 'No sessions today'}
          </span>
        </Card>
      </div>

      {/* Main Grid: Upcoming Timeline + Featured Real Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Events Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Upcoming Campus Events Timeline
            </h2>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View Full Calendar
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingApproved.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 text-xs">
                No upcoming confirmed events scheduled. Be the first to book a venue!
              </Card>
            ) : (
              upcomingApproved.map((b) => {
                const venue = venueMap.get(b.assignedVenueId || b.requestedVenueId)
                const categoryProps = getCategoryBadgeProps(b.eventCategory)
                return (
                  <Card key={b.id} hoverable className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor}`}>
                            {categoryProps.label}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {b.referenceCode}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {b.eventTitle}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {b.eventDescription}
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0 bg-slate-50 p-2.5 sm:p-0 sm:bg-transparent rounded-lg">
                        <div className="text-xs font-bold text-indigo-900">
                          {formatDateIST(b.requestedDate)}
                        </div>
                        <div className="text-[11px] text-slate-600 flex sm:justify-end items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTimeIST(b.requestedStart)} - {formatTimeIST(b.requestedEnd)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex sm:justify-end items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{venue?.name}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Venue Highlights & Guidelines */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600" />
              Real NMAMIT Venues
            </h2>
            <button
              onClick={() => onNavigate('venues')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Browse All
            </button>
          </div>

          <div className="space-y-3">
            {venues.filter(v => !v.isDemoVenue).map((venue) => (
              <Card
                key={venue.id}
                hoverable
                className="p-3.5 cursor-pointer"
                onClick={() => onNavigate('venues')}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {venue.name}
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                        {venue.maxCapacity} Seats
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {venue.block}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                      • {venue.equipment.slice(0, 2).join(', ')}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Guidelines Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Institutional Booking Rules
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600 pl-4 list-disc">
              <li>Bookings require authorization from Faculty Advisor or HOD.</li>
              <li>Setup buffer of 15m is automatically reserved before sessions.</li>
              <li>Sambhram Hall requires 48-hour prior notification.</li>
            </ul>
            <button
              onClick={() => onNavigate('guidelines')}
              className="text-xs font-semibold text-indigo-600 hover:underline pt-1 block"
            >
              Read Full Guidelines →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
