import React, { useState, useEffect, useMemo } from 'react'
import { BookingHistoryItem } from '@/types'
import { 
  fetchAllEventHistory, 
  exportEventHistoryToJSON, 
  exportEventHistoryToCSV, 
  getDatabaseDiagnostics 
} from '@/lib/eventHistoryDB'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { formatDateIST, downloadFile } from '@/lib/utils'
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  History, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Clock,
  Layers,
  ArrowRight,
  User,
  Eye
} from 'lucide-react'

export const EventHistoryDBPage: React.FC = () => {
  const [historyRecords, setHistoryRecords] = useState<BookingHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedRecord, setSelectedRecord] = useState<BookingHistoryItem | null>(null)
  const [dbDiagnostics, setDbDiagnostics] = useState<{
    databaseName: string
    tableName: string
    totalRecords: number
    primaryEngine: string
    isRemoteSyncConfigured: boolean
    isIndexedDBSupported: boolean
    lastCheckedAt: string
  } | null>(null)

  const loadDatabaseRecords = async () => {
    setIsLoading(true)
    try {
      const [records, diag] = await Promise.all([
        fetchAllEventHistory(),
        getDatabaseDiagnostics()
      ])
      setHistoryRecords(records)
      setDbDiagnostics(diag)
    } catch (err) {
      console.error('Failed to load event history from DB:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDatabaseRecords()
  }, [])

  const filteredRecords = useMemo(() => {
    return historyRecords.filter(item => {
      if (actionFilter !== 'all' && (item.actionType || item.newStatus) !== actionFilter) return false
      if (roleFilter !== 'all' && (item.changedByRole || 'user') !== roleFilter) return false

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesRef = item.bookingId.toLowerCase().includes(term)
        const matchesTitle = item.eventTitle?.toLowerCase().includes(term)
        const matchesVenue = item.venueName?.toLowerCase().includes(term)
        const matchesUser = item.changedByName.toLowerCase().includes(term)
        const matchesComments = item.comments.toLowerCase().includes(term)
        if (!matchesRef && !matchesTitle && !matchesVenue && !matchesUser && !matchesComments) {
          return false
        }
      }
      return true
    })
  }, [historyRecords, actionFilter, roleFilter, searchTerm])

  const handleExportJSON = async () => {
    const jsonStr = await exportEventHistoryToJSON()
    downloadFile(jsonStr, `campusconnect_event_history_db_${Date.now()}.json`, 'application/json')
  }

  const handleExportCSV = async () => {
    const csvStr = await exportEventHistoryToCSV()
    downloadFile(csvStr, `campusconnect_event_history_db_${Date.now()}.csv`, 'text/csv;charset=utf-8;')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Event History Database
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
              <Database className="w-3 h-3" />
              IndexedDB Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Persistent audit trail tracking every booking lifecycle event: creation, administrator approval, rejection, and rescheduling.
          </p>
        </div>

        {/* Database Export & Refresh Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadDatabaseRecords}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-900' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            title="Export CSV audit file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            title="Export full JSON database"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Database Diagnostic & Architecture Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Database Engine
            </span>
            <Database className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">
            {dbDiagnostics?.primaryEngine || 'IndexedDB'}
          </p>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ACID Local Storage Engine
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total DB Records
            </span>
            <Layers className="w-4 h-4 text-indigo-700" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">
            {historyRecords.length} Audit Entries
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Table: <code className="font-mono text-indigo-700">event_history</code>
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Admin Clearances
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">
            {historyRecords.filter(h => h.actionType === 'Approved' || h.newStatus === 'Approved').length} Approved
          </p>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
            {historyRecords.filter(h => h.actionType === 'Rejected' || h.newStatus === 'Rejected').length} Rejected by Admin
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Remote Sync (Supabase)
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-1">
            {dbDiagnostics?.isRemoteSyncConfigured ? 'Live PostgreSQL' : 'Local Standalone'}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {dbDiagnostics?.isRemoteSyncConfigured ? 'Dual-write active' : 'IndexedDB offline persistent'}
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search database by booking ID, event title, venue name, user, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Actions ({historyRecords.length})</option>
              <option value="Created">Created</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Reassigned">Reassigned</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator Only</option>
              <option value="user">Organizer Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Booking Ref & Event</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status Lifecycle</th>
                <th className="py-3 px-4">Changed By</th>
                <th className="py-3 px-4">Audit Comments / Reason</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No event history records match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const action = item.actionType || item.newStatus
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formatDateIST(item.createdAt)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 block w-fit mb-0.5">
                          {item.bookingId}
                        </span>
                        <span className="font-semibold text-slate-900 block max-w-xs truncate" title={item.eventTitle}>
                          {item.eventTitle || 'Campus Reservation'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {item.venueName || '—'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          action === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          action === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          action === 'Created' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          action === 'Cancelled' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {action}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-slate-500">{item.previousStatus}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-900">{item.newStatus}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{item.changedByName}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            item.changedByRole === 'admin' 
                              ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.changedByRole || 'user'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed" title={item.comments}>
                          {item.comments}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Inspect Database Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Record Inspector Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="IndexedDB Raw Record Inspector"
        description={`Record ID: ${selectedRecord?.id}`}
        maxWidth="lg"
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">RECORD ID</span>
                <span className="text-slate-900 font-bold">{selectedRecord.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">BOOKING ID</span>
                <span className="text-indigo-900 font-bold">{selectedRecord.bookingId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TIMESTAMP</span>
                <span className="text-slate-900">{formatDateIST(selectedRecord.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ACTOR ROLE</span>
                <span className="text-slate-900 font-bold uppercase">{selectedRecord.changedByRole || 'user'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Audit Log Comments / Administrative Reason:</span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                {selectedRecord.comments}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Raw Database JSON Payload:</span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
