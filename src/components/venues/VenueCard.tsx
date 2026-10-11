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
  Sparkles, 
  ShieldCheck,
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
      {/* Venue Image Banner */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

        {/* Real vs Demo badge */}
        <div className="absolute top-3 left-3">
          {!venue.isDemoVenue ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-900/90 text-white backdrop-blur-md shadow-xs border border-blue-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              NMAMIT Venue
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-200 backdrop-blur-md">
              Demo Venue
            </span>
          )}
        </div>

        {/* Type pill on top right */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-md">
            {venue.venueType}
          </span>
        </div>

        {/* Bottom overlay: Location and Capacity */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">{venue.block}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{venue.minCapacity}–{venue.maxCapacity}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
              {venue.name}
            </h3>
            {venue.maintenanceStatus !== 'normal' && (
              <Badge variant="warning">Maintenance</Badge>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {venue.description}
          </p>

          {/* Operating hours & Recommended */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 py-2 border-y border-slate-100 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {venue.operatingHours.start} - {venue.operatingHours.end}
            </span>
            <span className="text-indigo-700 font-semibold">
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
                <CheckCircle2 className="w-2.5 h-2.5 text-indigo-500" />
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
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-colors"
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
