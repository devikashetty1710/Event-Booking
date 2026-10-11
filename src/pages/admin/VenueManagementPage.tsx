import React, { useState } from 'react'
import { Venue, Booking, VenueMaintenanceBlock, VenueBlock, VenueType } from '@/types'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Modal } from '@/components/common/Modal'
import { saveVenue, addMaintenanceBlock, deleteMaintenanceBlock } from '@/lib/storage'
import { formatDateIST, formatTimeIST } from '@/lib/utils'
import { 
  Building2, 
  Plus, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ShieldAlert, 
  Sparkles,
  Users
} from 'lucide-react'

interface VenueManagementPageProps {
  venues: Venue[]
  bookings: Booking[]
  maintenanceBlocks: VenueMaintenanceBlock[]
}

export const VenueManagementPage: React.FC<VenueManagementPageProps> = ({
  venues,
  bookings,
  maintenanceBlocks
}) => {
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [isNewVenue, setIsNewVenue] = useState(false)
  
  // Maintenance block form state
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [selectedVenueForMaint, setSelectedVenueForMaint] = useState(venues[0]?.id || '')
  const [maintDate, setMaintDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [maintReason, setMaintReason] = useState('')

  const handleEditClick = (venue: Venue) => {
    setEditingVenue({ ...venue })
    setIsNewVenue(false)
  }

  const handleCreateNewClick = () => {
    const newV: Venue = {
      id: `venue-${Date.now()}`,
      name: '',
      block: 'Academic Administration Block',
      venueType: 'Seminar Hall',
      description: '',
      minCapacity: 20,
      maxCapacity: 100,
      recommendedCapacity: 80,
      facilities: ['Air Conditioned', 'Smart Lectern'],
      equipment: ['Projector and display screen', 'Wireless microphone', 'Wi-Fi'],
      operatingHours: { start: '08:00', end: '20:00' },
      accessibilityFeatures: ['Elevator Access'],
      imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
      isActive: true,
      maintenanceStatus: 'normal',
      approvalRequired: true,
      isDemoVenue: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingVenue(newV)
    setIsNewVenue(true)
  }

  const handleSaveVenue = async () => {
    if (!editingVenue || !editingVenue.name.trim()) return
    await saveVenue(editingVenue)
    setEditingVenue(null)
  }

  const handleCreateMaintenanceBlock = async () => {
    if (!selectedVenueForMaint || !maintReason.trim()) return
    const v = venues.find(item => item.id === selectedVenueForMaint)
    await addMaintenanceBlock({
      venueId: selectedVenueForMaint,
      venueName: v?.name || 'Venue',
      blockedStart: `${maintDate}T08:00:00Z`,
      blockedEnd: `${maintDate}T18:00:00Z`,
      reason: maintReason,
      createdBy: 'Dean of Student Affairs'
    })
    setIsMaintenanceModalOpen(false)
    setMaintReason('')
  }

  const handleDeleteMaintBlock = async (id: string) => {
    await deleteMaintenanceBlock(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Campus Venue Management & Facility Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure capacities, AV equipment, operating hours, and schedule maintenance blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-xs transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Add Maintenance Block
          </button>
          <button
            onClick={handleCreateNewClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Demo Venue
          </button>
        </div>
      </div>

      {/* Active Maintenance Blocks Card */}
      {maintenanceBlocks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Active Scheduled Maintenance Closures ({maintenanceBlocks.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {maintenanceBlocks.map(mb => (
              <div key={mb.id} className="bg-white p-3 rounded-xl border border-amber-200 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{mb.venueName}</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">{mb.reason}</p>
                  <span className="text-[10px] text-amber-800 font-medium block mt-1">
                    Date: {formatDateIST(mb.blockedStart)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteMaintBlock(mb.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove maintenance block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Venues Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {venues.map(v => {
          // Check upcoming active bookings count
          const activeBookingsCount = bookings.filter(
            b => (b.assignedVenueId || b.requestedVenueId) === v.id && b.status === 'Approved'
          ).length

          return (
            <Card key={v.id} className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{v.name}</h3>
                    <span className="text-xs text-slate-500">{v.block}</span>
                  </div>
                  {!v.isDemoVenue ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                      NMAMIT Real
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Demo Venue
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Capacities</span>
                    <span className="font-semibold text-slate-800">{v.minCapacity} – {v.maxCapacity} Seats</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Active Bookings</span>
                    <span className="font-semibold text-indigo-700">{activeBookingsCount} Confirmed</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Operating Window</span>
                    <span className="text-slate-700">{v.operatingHours.start} - {v.operatingHours.end}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Status</span>
                    <span className={`font-semibold ${v.maintenanceStatus === 'normal' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {v.maintenanceStatus === 'normal' ? 'Operational' : 'Under Maintenance'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                  {v.description}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleEditClick(v)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Configuration & Hours
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Venue Edit / Create Modal */}
      {editingVenue && (
        <Modal
          isOpen={!!editingVenue}
          onClose={() => setEditingVenue(null)}
          title={isNewVenue ? 'Add New Facility' : `Edit Venue: ${editingVenue.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Venue Name</label>
              <input
                type="text"
                value={editingVenue.name}
                onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Campus Block</label>
                <select
                  value={editingVenue.block}
                  onChange={(e) => setEditingVenue({ ...editingVenue, block: e.target.value as VenueBlock })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="APJ Kalam Block">APJ Kalam Block</option>
                  <option value="Ramanujan Block">Ramanujan Block</option>
                  <option value="Academic Administration Block">Academic Administration Block</option>
                  <option value="Innovation and Research Block">Innovation and Research Block</option>
                  <option value="Central Campus">Central Campus</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Venue Type</label>
                <select
                  value={editingVenue.venueType}
                  onChange={(e) => setEditingVenue({ ...editingVenue, venueType: e.target.value as VenueType })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Auditorium">Auditorium</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Conference Room">Conference Room</option>
                  <option value="Boardroom">Boardroom</option>
                  <option value="Lab">Lab</option>
                  <option value="Open-Air Facility">Open-Air Facility</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Min Capacity</label>
                <input
                  type="number"
                  value={editingVenue.minCapacity}
                  onChange={(e) => setEditingVenue({ ...editingVenue, minCapacity: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Max Capacity</label>
                <input
                  type="number"
                  value={editingVenue.maxCapacity}
                  onChange={(e) => setEditingVenue({ ...editingVenue, maxCapacity: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Recommended</label>
                <input
                  type="number"
                  value={editingVenue.recommendedCapacity}
                  onChange={(e) => setEditingVenue({ ...editingVenue, recommendedCapacity: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Operating Start</label>
                <input
                  type="time"
                  value={editingVenue.operatingHours.start}
                  onChange={(e) => setEditingVenue({
                    ...editingVenue,
                    operatingHours: { ...editingVenue.operatingHours, start: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Operating End</label>
                <input
                  type="time"
                  value={editingVenue.operatingHours.end}
                  onChange={(e) => setEditingVenue({
                    ...editingVenue,
                    operatingHours: { ...editingVenue.operatingHours, end: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Maintenance Status</label>
              <select
                value={editingVenue.maintenanceStatus}
                onChange={(e) => setEditingVenue({
                  ...editingVenue,
                  maintenanceStatus: e.target.value as any
                })}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="normal">Operational (Normal)</option>
                <option value="under_maintenance">Under Scheduled Maintenance</option>
                <option value="temporarily_closed">Temporarily Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Description</label>
              <textarea
                rows={2}
                value={editingVenue.description}
                onChange={(e) => setEditingVenue({ ...editingVenue, description: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingVenue(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVenue}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Maintenance Block Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Schedule Venue Maintenance Block"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Select Venue</label>
            <select
              value={selectedVenueForMaint}
              onChange={(e) => setSelectedVenueForMaint(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
            >
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.block})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Maintenance Date</label>
            <input
              type="date"
              value={maintDate}
              onChange={(e) => setMaintDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Reason / OEM Servicing Description</label>
            <textarea
              rows={3}
              value={maintReason}
              onChange={(e) => setMaintReason(e.target.value)}
              placeholder="e.g. Stage lighting ballast replacement and acoustic calibration..."
              className="w-full p-2.5 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateMaintenanceBlock}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm Maintenance Block
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
