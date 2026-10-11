import React from 'react'
import { Booking, Venue } from '@/types'
import { CampusCalendar } from '@/components/calendar/CampusCalendar'
import { Calendar as CalendarIcon, Info } from 'lucide-react'

interface CampusCalendarPageProps {
  bookings: Booking[]
  venues: Venue[]
  onQuickBookSlot: (date: string, time: string) => void
}

export const CampusCalendarPage: React.FC<CampusCalendarPageProps> = ({
  bookings,
  venues,
  onQuickBookSlot
}) => {
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Shared Campus Calendar
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explore approved events across NMAMIT seminar halls, auditoriums, and open facilities.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Click on any empty time slot or day to initiate a fast booking request.</span>
        </div>
      </div>

      {/* Main Interactive Calendar */}
      <CampusCalendar
        bookings={bookings}
        venues={venues}
        onQuickBookSlot={onQuickBookSlot}
        isMasterAdminCalendar={false}
      />
    </div>
  )
}
