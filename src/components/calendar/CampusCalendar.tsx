import React, { useState, useMemo } from 'react'
import { Booking, Venue, EventCategory, BookingStatus } from '@/types'
import { EventDetailModal } from './EventDetailModal'
import { QrCodeModal } from '../common/QrCodeModal'
import { useAuth } from '@/context/AuthContext'
import { formatDateIST, formatTimeIST, getCategoryBadgeProps, getStatusBadgeProps } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  MapPin, 
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  CalendarDays
} from 'lucide-react'

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda'

interface CampusCalendarProps {
  bookings: Booking[]
  venues: Venue[]
  onQuickBookSlot?: (date: string, startTime: string) => void
  isMasterAdminCalendar?: boolean
}

export const CampusCalendar: React.FC<CampusCalendarProps> = ({
  bookings,
  venues,
  onQuickBookSlot,
  isMasterAdminCalendar = false
}) => {
  const { isAdmin } = useAuth()

  // Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<string>('all')
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>(isMasterAdminCalendar ? 'all' : 'Approved')

  // Selected event modal state
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [qrModalBooking, setQrModalBooking] = useState<Booking | null>(null)

  // Venue lookup map
  const venueMap = useMemo(() => {
    const map = new Map<string, Venue>()
    venues.forEach(v => map.set(v.id, v))
    return map
  }, [venues])

  // Filter bookings based on role and filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Ordinary users only see approved public or campus-only events
      if (!isAdmin && !isMasterAdminCalendar) {
        if (b.status !== 'Approved') return false
        if (b.visibility === 'private_invited') return false
      }

      // Status filter
      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesTitle = b.eventTitle.toLowerCase().includes(term)
        const matchesOrganizer = b.organizerName.toLowerCase().includes(term)
        const matchesDept = b.department.toLowerCase().includes(term)
        if (!matchesTitle && !matchesOrganizer && !matchesDept) return false
      }

      // Venue filter
      const assignedId = b.assignedVenueId || b.requestedVenueId
      if (selectedVenueId !== 'all' && assignedId !== selectedVenueId) return false

      // Block filter
      const v = venueMap.get(assignedId)
      if (selectedBlock !== 'all' && v?.block !== selectedBlock) return false

      // Category filter
      if (selectedCategory !== 'all' && b.eventCategory !== selectedCategory) return false

      return true
    })
  }, [bookings, isAdmin, isMasterAdminCalendar, selectedStatus, searchTerm, selectedVenueId, selectedBlock, selectedCategory, venueMap])

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1)
    else if (viewMode === 'week') d.setDate(d.getDate() - 7)
    else if (viewMode === 'day') d.setDate(d.getDate() - 1)
    else d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1)
    else if (viewMode === 'week') d.setDate(d.getDate() + 7)
    else if (viewMode === 'day') d.setDate(d.getDate() + 1)
    else d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Month View Calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const daysInPrevMonth = new Date(year, month, 0).getDate()

    // 42 cells grid (6 weeks x 7 days)
    const days = []

    // Previous month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const prevDate = new Date(year, month - 1, dayNum)
      const dateStr = prevDate.toISOString().split('T')[0]
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i)
      const dateStr = curDate.toISOString().split('T')[0]
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      })
    }

    // Next month padding to reach 42 or 35 cells
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i)
      const dateStr = nextDate.toISOString().split('T')[0]
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      })
    }

    return days
  }, [currentDate])

  // Week View Calculation
  const weekData = useMemo(() => {
    const curr = new Date(currentDate)
    const first = curr.getDate() - curr.getDay()
    const days = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i))
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: d,
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === new Date().toISOString().split('T')[0]
      })
    }
    return days
  }, [currentDate])

  // Hours array for week & day views (08:00 to 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedBlock('all')
    setSelectedVenueId('all')
    setSelectedCategory('all')
    setSelectedStatus(isMasterAdminCalendar ? 'all' : 'Approved')
  }

  // Header Title
  const formattedHeaderTitle = useMemo(() => {
    if (viewMode === 'month' || viewMode === 'agenda') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    }
    if (viewMode === 'week') {
      const start = weekData[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const end = weekData[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${start} – ${end}`
    }
    return ''
  }, [currentDate, viewMode, weekData])

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campus events, organizers, or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {onQuickBookSlot && (
            <button
              onClick={() => onQuickBookSlot(new Date().toISOString().split('T')[0], '10:00')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Request Venue Booking
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Campus Blocks</option>
            <option value="APJ Kalam Block">APJ Kalam Block</option>
            <option value="Ramanujan Block">Ramanujan Block</option>
            <option value="Academic Administration Block">Academic Administration</option>
            <option value="Innovation and Research Block">Innovation Block</option>
            <option value="Central Campus">Central Campus</option>
          </select>

          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Venues</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} {!v.isDemoVenue ? '★ Real' : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="seminar">Seminar</option>
            <option value="workshop">Workshop</option>
            <option value="technical_event">Technical / Hackathon</option>
            <option value="cultural_event">Cultural Activity</option>
            <option value="club_activity">Club Activity</option>
            <option value="conference">Conference</option>
            <option value="meeting">Meeting</option>
          </select>

          {(isAdmin || isMasterAdminCalendar) && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-amber-900 font-bold focus:outline-none"
            >
              <option value="all">All Statuses (Approved & Pending)</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending Approval">Pending Approval Only</option>
              <option value="Under Review">Under Review Only</option>
            </select>
          )}

          <button
            onClick={resetFilters}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1 ml-auto text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Calendar Navigation Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs p-0.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">
              {formattedHeaderTitle}
            </h2>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-blue-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'agenda' ? 'Agenda List' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* ================= 1. MONTH VIEW ================= */}
        {viewMode === 'month' && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/70 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Grid 6 weeks */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 border-b border-slate-100">
                {monthData.map((cell, idx) => {
                  const dayEvents = filteredBookings.filter(b => b.requestedDate === cell.dateStr)

                  return (
                    <div
                      key={idx}
                      onClick={() => onQuickBookSlot?.(cell.dateStr, '10:00')}
                      className={`min-h-[110px] p-2 transition-colors group cursor-pointer ${
                        cell.isCurrentMonth ? 'bg-white hover:bg-indigo-50/15' : 'bg-slate-50/50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            cell.isToday
                              ? 'bg-blue-900 text-white font-extrabold shadow-xs'
                              : cell.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {cell.isCurrentMonth && (
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-bold transition-opacity">
                            + Book
                          </span>
                        )}
                      </div>

                      {/* Event pills inside day cell */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => {
                          const venue = venueMap.get(event.assignedVenueId || event.requestedVenueId)
                          const categoryProps = getCategoryBadgeProps(event.eventCategory)
                          const isPending = event.status === 'Pending Approval' || event.status === 'Under Review'

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveBooking(event)
                                setIsDetailModalOpen(true)
                              }}
                              className={`p-1 rounded-md text-[11px] leading-tight border transition-transform hover:scale-[1.02] shadow-2xs truncate ${
                                isPending
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                                  : `${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor} font-medium`
                              }`}
                              title={`${event.eventTitle} (${venue?.name})`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-bold shrink-0">{event.requestedStart}</span>
                                <span className="truncate">{event.eventTitle}</span>
                              </div>
                            </div>
                          )
                        })}

                        {dayEvents.length > 3 && (
                          <div className="text-[10px] font-bold text-indigo-600 pl-1">
                            +{dayEvents.length - 3} more events
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. WEEK VIEW ================= */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Days */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                <div className="p-3 text-center text-slate-400 border-r border-slate-200">Time</div>
                {weekData.map((d, i) => (
                  <div
                    key={i}
                    className={`p-2.5 text-center border-r border-slate-200 last:border-r-0 ${
                      d.isToday ? 'bg-indigo-50 text-indigo-900' : ''
                    }`}
                  >
                    <span className="block text-[10px] text-slate-500 uppercase">{d.dayName}</span>
                    <span className={`inline-block text-sm font-bold mt-0.5 ${d.isToday ? 'text-indigo-700' : ''}`}>
                      {d.dayNum}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hours Grid */}
              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                {hours.map((hour) => {
                  const hourStr = `${hour.toString().padStart(2, '0')}:00`
                  return (
                    <div key={hour} className="grid grid-cols-8 min-h-[55px]">
                      <div className="p-2 text-[11px] font-mono text-slate-400 border-r border-slate-100 text-center bg-slate-50/30">
                        {hourStr}
                      </div>
                      {weekData.map((d, i) => {
                        const cellEvents = filteredBookings.filter(b => {
                          if (b.requestedDate !== d.dateStr) return false
                          const [sh] = b.requestedStart.split(':').map(Number)
                          return sh === hour
                        })

                        return (
                          <div
                            key={i}
                            onClick={() => onQuickBookSlot?.(d.dateStr, hourStr)}
                            className="p-1 border-r border-slate-100 last:border-r-0 hover:bg-slate-50/60 transition-colors cursor-pointer"
                          >
                            {cellEvents.map(event => {
                              const venue = venueMap.get(event.assignedVenueId || event.requestedVenueId)
                              const categoryProps = getCategoryBadgeProps(event.eventCategory)
                              return (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveBooking(event)
                                    setIsDetailModalOpen(true)
                                  }}
                                  className={`p-1.5 rounded-lg text-[10px] border leading-tight ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor} shadow-2xs mb-1`}
                                >
                                  <div className="font-bold truncate">{event.eventTitle}</div>
                                  <div className="text-[9px] opacity-80">{venue?.name}</div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. DAY VIEW ================= */}
        {viewMode === 'day' && (
          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {hours.map((hour) => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`
              const dayStr = currentDate.toISOString().split('T')[0]
              const hourEvents = filteredBookings.filter(b => {
                if (b.requestedDate !== dayStr) return false
                const [sh] = b.requestedStart.split(':').map(Number)
                return sh === hour
              })

              return (
                <div
                  key={hour}
                  onClick={() => onQuickBookSlot?.(dayStr, hourStr)}
                  className="grid grid-cols-12 min-h-[65px] hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <div className="col-span-2 sm:col-span-1 p-3 text-xs font-mono text-slate-400 border-r border-slate-100 text-center bg-slate-50/30">
                    {hourStr}
                  </div>
                  <div className="col-span-10 sm:col-span-11 p-2 space-y-2">
                    {hourEvents.map(event => {
                      const venue = venueMap.get(event.assignedVenueId || event.requestedVenueId)
                      const categoryProps = getCategoryBadgeProps(event.eventCategory)
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveBooking(event)
                            setIsDetailModalOpen(true)
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor} shadow-xs`}
                        >
                          <div>
                            <span className="font-bold text-xs block">{event.eventTitle}</span>
                            <span className="text-[11px] opacity-80">
                              {event.organizerName} • {venue?.name} ({venue?.block})
                            </span>
                          </div>
                          <span className="text-xs font-bold shrink-0">
                            {event.requestedStart} – {event.requestedEnd}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ================= 4. AGENDA / LIST VIEW ================= */}
        {viewMode === 'agenda' && (
          <div className="divide-y divide-slate-100">
            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No events match your current filter criteria.
              </div>
            ) : (
              filteredBookings
                .sort((a, b) => a.requestedDate.localeCompare(b.requestedDate))
                .map((event) => {
                  const venue = venueMap.get(event.assignedVenueId || event.requestedVenueId)
                  const categoryProps = getCategoryBadgeProps(event.eventCategory)
                  const statusProps = getStatusBadgeProps(event.status)

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        setActiveBooking(event)
                        setIsDetailModalOpen(true)
                      }}
                      className="p-4 sm:p-5 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryProps.color} ${categoryProps.textColor} ${categoryProps.borderColor}`}>
                            {categoryProps.label}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {event.referenceCode}
                          </span>
                          {isMasterAdminCalendar && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusProps.bgClass} ${statusProps.textClass}`}>
                              {statusProps.label}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {event.eventTitle}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {event.eventDescription}
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0 bg-slate-50 p-2.5 sm:p-0 sm:bg-transparent rounded-lg text-xs">
                        <div className="font-bold text-indigo-900">
                          {formatDateIST(event.requestedDate)}
                        </div>
                        <div className="text-slate-600 flex sm:justify-end items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatTimeIST(event.requestedStart)} – {formatTimeIST(event.requestedEnd)}
                        </div>
                        <div className="text-slate-500 flex sm:justify-end items-center gap-1 mt-0.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {venue?.name}
                        </div>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600 font-semibold text-[11px]">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Category Legend:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Seminar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            Workshop
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Technical / Fest
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500" />
            Cultural
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Club Activity
          </span>
          {(isAdmin || isMasterAdminCalendar) && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600" />
              Pending Admin Review
            </span>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        booking={activeBooking}
        venue={activeBooking ? venueMap.get(activeBooking.assignedVenueId || activeBooking.requestedVenueId) || null : null}
        onOpenQr={(b) => setQrModalBooking(b)}
      />

      {/* QR Code Pass Modal */}
      {qrModalBooking && (
        <QrCodeModal
          isOpen={!!qrModalBooking}
          onClose={() => setQrModalBooking(null)}
          booking={qrModalBooking}
          venueName={venueMap.get(qrModalBooking.assignedVenueId || qrModalBooking.requestedVenueId)?.name || 'Venue'}
        />
      )}
    </div>
  )
}
