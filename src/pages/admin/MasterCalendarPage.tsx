import React from 'react'
import { Booking, Venue } from '@/types'
import { CampusCalendar } from '@/components/calendar/CampusCalendar'
import { Shield, Info } from 'lucide-react'

interface MasterCalendarPageProps {
  bookings: Booking[]
  venues: Venue[]
}

export const MasterCalendarPage: React.FC<MasterCalendarPageProps> = ({
  bookings,
  venues
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Campus Master Calendar (Administrative Control)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
              Admin Master View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated operational schedule showing approved events, pending reviews, and maintenance buffers across all blocks.
          </p>
        </div>

        <div className="text-xs text-amber-900 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Pending requests are rendered with amber badges to help spot preliminary scheduling density.</span>
        </div>
      </div>

      <CampusCalendar
        bookings={bookings}
        venues={venues}
        isMasterAdminCalendar={true}
      />
    </div>
  )
}
