import React from 'react'
import { Booking, Venue } from '@/types'
import { Card } from '@/components/common/Card'
import { formatDateIST, downloadFile } from '@/lib/utils'
import { BarChart3, Download, Calendar, CheckCircle2, TrendingUp, Building2 } from 'lucide-react'

interface ReportsAnalyticsPageProps {
  bookings: Booking[]
  venues: Venue[]
}

export const ReportsAnalyticsPage: React.FC<ReportsAnalyticsPageProps> = ({
  bookings,
  venues
}) => {
  const approvedBookings = bookings.filter(b => b.status === 'Approved')

  const exportCSV = () => {
    const headers = ['Reference Code', 'Event Title', 'Category', 'Organizer', 'Department', 'Venue', 'Date', 'Start Time', 'End Time', 'Status', 'Audience Size']
    const rows = bookings.map(b => {
      const v = venues.find(item => item.id === (b.assignedVenueId || b.requestedVenueId))
      return [
        b.referenceCode,
        `"${b.eventTitle.replace(/"/g, '""')}"`,
        b.eventCategory,
        `"${b.organizerName}"`,
        `"${b.department}"`,
        `"${v?.name || 'Venue'}"`,
        b.requestedDate,
        b.requestedStart,
        b.requestedEnd,
        b.status,
        b.expectedAttendees
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    downloadFile(csvContent, `NMAMIT_Campus_Bookings_Report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Reports & Campus Utilization Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Auditing space occupancy, departmental usage trends, and generating administrative reports.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          Export All Bookings to CSV
        </button>
      </div>

      {/* Utilization Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Venue Occupancy & Reservation Density Audit
          </h3>
          <span className="text-xs text-slate-500">{venues.length} Facilities Tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Venue & Block</th>
                <th className="py-3 px-4">Max Capacity</th>
                <th className="py-3 px-4">Confirmed Bookings</th>
                <th className="py-3 px-4">Total Reserved Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {venues.map(v => {
                const venueBookings = approvedBookings.filter(b => (b.assignedVenueId || b.requestedVenueId) === v.id)
                const totalHours = venueBookings.reduce((acc, curr) => {
                  const [sh, sm] = curr.requestedStart.split(':').map(Number)
                  const [eh, em] = curr.requestedEnd.split(':').map(Number)
                  return acc + Math.max(1, (eh * 60 + em - (sh * 60 + sm)) / 60)
                }, 0)

                return (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {v.name}
                      <span className="block text-[11px] font-normal text-slate-400">{v.block}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {v.maxCapacity} Seats
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {venueBookings.length} Events
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {Math.round(totalHours)} hrs
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.maintenanceStatus === 'normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {v.maintenanceStatus === 'normal' ? 'Active' : 'Maintenance'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
