import React, { useMemo } from 'react'
import { Booking, Venue, VenueMaintenanceBlock } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { formatDateIST, formatTimeIST, getStatusBadgeProps } from '@/lib/utils'
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  Calendar, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'

interface AdminDashboardProps {
  bookings: Booking[]
  venues: Venue[]
  maintenanceBlocks: VenueMaintenanceBlock[]
  onNavigate: (tab: string) => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  venues,
  maintenanceBlocks,
  onNavigate
}) => {
  // KPI Metrics
  const activeVenuesCount = venues.filter(v => v.isActive && v.maintenanceStatus === 'normal').length
  const pendingCount = bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review').length
  const approvedCount = bookings.filter(b => b.status === 'Approved').length
  const rejectedCount = bookings.filter(b => b.status === 'Rejected').length
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length
  
  const todayStr = new Date().toISOString().split('T')[0]
  const todayEvents = bookings.filter(b => b.requestedDate === todayStr && b.status === 'Approved')
  const maintenanceCount = venues.filter(v => v.maintenanceStatus !== 'normal').length + maintenanceBlocks.length

  // Calculate venue utilization data for Recharts
  const venueUtilizationData = useMemo(() => {
    return venues.slice(0, 6).map(v => {
      const venueBookings = bookings.filter(
        b => (b.assignedVenueId || b.requestedVenueId) === v.id && b.status === 'Approved'
      )
      // Estimated hours reserved
      const hours = venueBookings.reduce((acc, curr) => {
        const [sh, sm] = curr.requestedStart.split(':').map(Number)
        const [eh, em] = curr.requestedEnd.split(':').map(Number)
        return acc + Math.max(1, (eh * 60 + em - (sh * 60 + sm)) / 60)
      }, 0)

      return {
        name: v.name.length > 15 ? v.name.substring(0, 14) + '…' : v.name,
        hours: Math.round(hours),
        bookings: venueBookings.length,
        capacity: v.maxCapacity
      }
    })
  }, [venues, bookings])

  // Category distribution data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    bookings.forEach(b => {
      const cat = b.eventCategory.replace('_', ' ')
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [bookings])

  const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b']

  // Monthly trends (demo data + active counts)
  const monthlyData = [
    { month: 'Jan', approved: 12, rejected: 1 },
    { month: 'Feb', approved: 19, rejected: 2 },
    { month: 'Mar', approved: 24, rejected: 4 },
    { month: 'Apr', approved: 18, rejected: 2 },
    { month: 'May', approved: 15, rejected: 1 },
    { month: 'Jun', approved: approvedCount, rejected: rejectedCount }
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Campus Administration & Operational Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            NMAMIT Campus Facilities • Real-time venue utilization, conflict monitor, and booking review queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => onNavigate('admin-requests')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors animate-pulse"
            >
              <Clock className="w-4 h-4" />
              <span>Review {pendingCount} Pending Requests</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('admin-calendar')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            Master Calendar
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Awaiting Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {pendingCount}
          </div>
          <span className="text-[11px] text-amber-700 font-medium block mt-1">
            Requires clearance
          </span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Approved Reservations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {approvedCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block mt-1">
            Active on campus calendar
          </span>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Venues</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {activeVenuesCount} / {venues.length}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            4 Real NMAMIT venues
          </span>
        </Card>

        <Card className="p-4 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Events Today</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-slate-900">
            {todayEvents.length}
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {todayEvents.length > 0 ? 'Halls in active use' : 'No sessions today'}
          </span>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Venue Utilization Hours */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Venue Utilization (Confirmed Hours)
              </h3>
              <p className="text-[11px] text-slate-500">Hours booked across premier seminar halls & auditoriums</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="hours" name="Booked Hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Event Category Distribution */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Event Categories Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Breakdown of academic, cultural, and technical fests</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${Math.round((percent ?? 0) * 100)}%)`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Review Queue Preview & Maintenance Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Review Queue */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Requests Awaiting Administrator Review
            </h2>
            <button
              onClick={() => onNavigate('admin-requests')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Open Full Review Queue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review').length === 0 ? (
            <Card className="p-8 text-center text-slate-500 text-xs">
              All booking requests have been reviewed! No items pending approval.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review').slice(0, 3).map((b) => {
                const venue = venues.find(v => v.id === b.requestedVenueId)
                return (
                  <Card key={b.id} hoverable className="p-4 cursor-pointer" onClick={() => onNavigate('admin-requests')}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {b.referenceCode}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{b.department}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{b.eventTitle}</h4>
                        <span className="text-xs text-slate-600">
                          Requested: <strong>{venue?.name}</strong> • {formatDateIST(b.requestedDate)} ({b.requestedStart} - {b.requestedEnd})
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigate('admin-requests')
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Maintenance & Facility Health */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Active Maintenance Blocks
            </h2>
            <button
              onClick={() => onNavigate('admin-venues')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Manage
            </button>
          </div>

          <div className="space-y-2.5">
            {maintenanceBlocks.length === 0 ? (
              <Card className="p-6 text-center text-slate-500 text-xs">
                No active maintenance shutdowns. All campus facilities are operational.
              </Card>
            ) : (
              maintenanceBlocks.map((mb) => (
                <Card key={mb.id} className="p-3.5 bg-amber-50/40 border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>{mb.venueName}</span>
                    <Badge variant="warning">Maintenance Block</Badge>
                  </div>
                  <p className="text-slate-600 text-[11px]">{mb.reason}</p>
                  <span className="text-[10px] text-slate-500 block pt-1">
                    Scheduled: {formatDateIST(mb.blockedStart)}
                  </span>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
