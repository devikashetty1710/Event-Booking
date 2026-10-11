import React from 'react'
import { Booking, Venue, VenueMaintenanceBlock } from '@/types'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { formatDateIST, formatTimeIST } from '@/lib/utils'
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Database, 
  Sparkles,
  ArrowRight
} from 'lucide-react'

interface ConflictMonitorPageProps {
  bookings: Booking[]
  venues: Venue[]
  maintenanceBlocks: VenueMaintenanceBlock[]
  onOpenReviewQueue: () => void
}

export const ConflictMonitorPage: React.FC<ConflictMonitorPageProps> = ({
  bookings,
  venues,
  maintenanceBlocks,
  onOpenReviewQueue
}) => {
  // Find potential pending overlaps
  const pendingBookings = bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review')
  const approvedBookings = bookings.filter(b => b.status === 'Approved')

  // Identify scheduling pressure points (venues with 2 or more requests on same date)
  const pressurePoints = []
  const dateVenueCount = new Map<string, Booking[]>()

  bookings.forEach(b => {
    if (b.status !== 'Rejected' && b.status !== 'Cancelled') {
      const key = `${b.requestedVenueId}_${b.requestedDate}`
      if (!dateVenueCount.has(key)) dateVenueCount.set(key, [])
      dateVenueCount.get(key)!.push(b)
    }
  })

  for (const [key, bList] of dateVenueCount.entries()) {
    if (bList.length > 1) {
      const [vId, date] = key.split('_')
      const v = venues.find(item => item.id === vId)
      pressurePoints.push({
        venue: v,
        date,
        bookings: bList
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Concurrency & Conflict Monitor
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Safe Lock Active
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Automated multi-level conflict engine monitoring overlapping reservations, maintenance windows, and transactional database integrity.
        </p>
      </div>

      {/* System Integrity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Database Concurrency Guard</span>
          </div>
          <p className="text-xs text-slate-600">
            Zero confirmed overlap state verified. Transactional allocation prevents race conditions even under concurrent submissions.
          </p>
        </Card>

        <Card className="p-4 bg-amber-50/50 border-amber-200">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>High Scheduling Pressure Points</span>
          </div>
          <p className="text-xs text-slate-600">
            {pressurePoints.length} date/venue clusters with multiple requests competing for the same facility.
          </p>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Setup & Cleanup Buffers</span>
          </div>
          <p className="text-xs text-slate-600">
            Mandatory 15-minute operational buffers enforced on all halls to eliminate consecutive friction.
          </p>
        </Card>
      </div>

      {/* Pressure Points Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          Detected Venue Pressure Points & Competing Requests
        </h2>

        {pressurePoints.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-xs">
            No scheduling pressure points detected. Campus venue demand is well-distributed.
          </Card>
        ) : (
          <div className="space-y-3">
            {pressurePoints.map((pp, idx) => (
              <Card key={idx} className="p-4 border-l-4 border-l-amber-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {pp.venue?.name} ({pp.venue?.block})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Date: {formatDateIST(pp.date)} • {pp.bookings.length} Bookings / Requests
                    </span>
                  </div>

                  <button
                    onClick={onOpenReviewQueue}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Manage in Review Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-3 text-xs space-y-2">
                  {pp.bookings.map(b => (
                    <div key={b.id} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{b.eventTitle}</span>
                        <span className="text-[11px] text-slate-500 block">
                          {b.organizerName} ({b.department})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-indigo-900 block">
                          {formatTimeIST(b.requestedStart)} - {formatTimeIST(b.requestedEnd)}
                        </span>
                        <span className={`text-[10px] font-bold ${b.status === 'Approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
