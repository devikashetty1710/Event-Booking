import React, { useState, useMemo } from 'react'
import { Venue, Booking, VenueBlock } from '@/types'
import { VenueCard } from '@/components/venues/VenueCard'
import { VenueDetailModal } from '@/components/venues/VenueDetailModal'
import { Search, Filter, Building2, Sparkles, SlidersHorizontal, Check } from 'lucide-react'

interface VenueDirectoryPageProps {
  venues: Venue[]
  bookings: Booking[]
  onBookVenue: (venueId: string) => void
}

export const VenueDirectoryPage: React.FC<VenueDirectoryPageProps> = ({
  venues,
  bookings,
  onBookVenue
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<string>('all')
  const [capacityFilter, setCapacityFilter] = useState<string>('all')
  const [onlyRealVenues, setOnlyRealVenues] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      if (onlyRealVenues && v.isDemoVenue) return false

      if (selectedBlock !== 'all' && v.block !== selectedBlock) return false

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesName = v.name.toLowerCase().includes(term)
        const matchesBlock = v.block.toLowerCase().includes(term)
        const matchesEquip = v.equipment.some(e => e.toLowerCase().includes(term))
        if (!matchesName && !matchesBlock && !matchesEquip) return false
      }

      if (capacityFilter === 'small' && v.maxCapacity > 50) return false
      if (capacityFilter === 'medium' && (v.maxCapacity <= 50 || v.maxCapacity > 150)) return false
      if (capacityFilter === 'large' && (v.maxCapacity <= 150 || v.maxCapacity > 300)) return false
      if (capacityFilter === 'mega' && v.maxCapacity <= 300) return false

      return true
    })
  }, [venues, onlyRealVenues, selectedBlock, searchTerm, capacityFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Campus Venue Directory
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {venues.length} Facilities Available
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Explore seminar halls, auditoriums, and conference rooms across NMAMIT blocks. Real college venues are certified with capacity and AV facilities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by venue name, block, or equipment (e.g. Projector, AC)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Real venues toggle */}
          <button
            type="button"
            onClick={() => setOnlyRealVenues(!onlyRealVenues)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              onlyRealVenues
                ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Only Real NMAMIT Venues</span>
            {onlyRealVenues && <Check className="w-3.5 h-3.5 ml-1" />}
          </button>
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
            <option value="Academic Administration Block">Academic Administration Block</option>
            <option value="Innovation and Research Block">Innovation Block</option>
            <option value="Central Campus">Central Campus</option>
          </select>

          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">Any Seating Capacity</option>
            <option value="small">Small (&le; 50 people)</option>
            <option value="medium">Medium (50 – 150 people)</option>
            <option value="large">Large (150 – 300 people)</option>
            <option value="mega">Auditorium (300+ people)</option>
          </select>

          <div className="ml-auto text-xs text-slate-500">
            Showing <strong>{filteredVenues.length}</strong> of {venues.length} venues
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      {filteredVenues.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          No venues match the selected filters. Try broadening your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onSelectVenue={(v) => setSelectedVenue(v)}
              onBookVenue={(vId) => onBookVenue(vId)}
            />
          ))}
        </div>
      )}

      {/* Venue Detail Modal */}
      <VenueDetailModal
        isOpen={!!selectedVenue}
        onClose={() => setSelectedVenue(null)}
        venue={selectedVenue}
        upcomingBookings={bookings}
        onBookVenue={(vId) => {
          setSelectedVenue(null)
          onBookVenue(vId)
        }}
      />
    </div>
  )
}
