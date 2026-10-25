import React from 'react'
import { Venue } from '@/types'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Building2,
  Eye
} from 'lucide-react'

interface VenueCardProps {
  venue: Venue
  onSelectVenue?: (venue: Venue) => void
  onBookVenue?: (venueId: string) => void
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onSelectVenue,
  onBookVenue
}) => {
  return (
    <Card hoverable className="flex flex-col h-full group border-slate-200">
      {/* Clean Venue Header (No Photos) */}
      <div className="p-4 bg-gradient-to-r from-blue-900/5 to-indigo-50/50 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                {venue.block}
              </span>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors mt-1 leading-snug">
                {venue.name}
              </h3>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-slate-700 border border-slate-200 shrink-0">
            {venue.venueType}
          </span>
        </div>

        {/* Capacity & Location Strip */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-800 shrink-0" />
            <span className="truncate">{venue.locationNotes || venue.block}</span>
          </span>

          <span className="flex items-center gap-1 font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
            <Users className="w-3.5 h-3.5 text-blue-800 shrink-0" />
            <span>{venue.minCapacity}–{venue.maxCapacity} seats</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {venue.maintenanceStatus !== 'normal' && (
            <div className="mb-2">
              <Badge variant="warning">Under Maintenance</Badge>
            </div>
          )}

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {venue.description}
          </p>

          {/* Operating hours & Recommended */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 py-2 border-y border-slate-100 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {venue.operatingHours.start} - {venue.operatingHours.end}
            </span>
            <span className="text-blue-900 font-semibold">
              Optimum: {venue.recommendedCapacity} seats
            </span>
          </div>

          {/* Equipment Pills preview */}
          <div className="flex flex-wrap gap-1 mb-4">
            {venue.equipment.slice(0, 3).map((eq, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-blue-700" />
                {eq}
              </span>
            ))}
            {venue.equipment.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-50 border border-slate-200">
                +{venue.equipment.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
          <button
            onClick={() => onSelectVenue?.(venue)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Facilities
          </button>

          {onBookVenue && (
            <button
              onClick={() => onBookVenue(venue.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-2xs transition-colors"
            >
              <span>Book</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
