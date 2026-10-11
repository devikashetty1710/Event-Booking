import React from 'react'
import { Venue } from '@/types'
import { Card } from '@/components/common/Card'
import { 
  Calendar, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  QrCode, 
  SlidersHorizontal,
  School,
  Lock,
  ChevronRight
} from 'lucide-react'

interface LandingPageProps {
  venues: Venue[]
  onGetStarted: () => void
  onExploreVenues: () => void
  onViewCalendar: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  venues,
  onGetStarted,
  onExploreVenues,
  onViewCalendar
}) => {
  const realVenues = venues.filter(v => !v.isDemoVenue)

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-14 border border-slate-800 shadow-xl">
        <div className="max-w-3xl relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/15">
            <School className="w-3.5 h-3.5 text-amber-300" />
            <span>NMAM Institute of Technology, Nitte</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight leading-[1.15]">
            One Campus. One Calendar. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
              Smarter Events.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            The unified digital infrastructure for venue discovery, concurrency-protected reservations, and shared master calendars across APJ Kalam Block, Ramanujan Block, and Central Campus.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <span>Access Campus Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onViewCalendar}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>View Shared Calendar</span>
            </button>
            <button
              onClick={onExploreVenues}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Browse Venues</span>
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Authorized @nmamit.in & @nitte.in
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Transactional Race Condition Guard
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Automated 15m Stage Buffering
            </span>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Featured Real NMAMIT Venues Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <School className="w-4 h-4" />
              <span>Official Campus Facilities</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-1">
              Real NMAMIT Seminar Halls & Auditoriums
            </h2>
          </div>
          <button
            onClick={onExploreVenues}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Explore All 8 Campus Spaces</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {realVenues.map((venue) => (
            <Card key={venue.id} hoverable className="group border-slate-200">
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img
                  src={venue.imageUrl}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/90 text-white backdrop-blur-md">
                    ★ Official
                  </span>
                </div>
                <div className="absolute bottom-2 left-3 right-3 text-white">
                  <span className="text-[10px] text-slate-300 block">{venue.block}</span>
                  <h3 className="font-bold text-xs font-heading truncate">{venue.name}</h3>
                </div>
              </div>

              <div className="p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Capacity: <strong>{venue.minCapacity}–{venue.maxCapacity}</strong></span>
                  <span className="text-emerald-700 font-bold">{venue.recommendedCapacity} Ideal</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {venue.description}
                </p>
                <button
                  onClick={onGetStarted}
                  className="w-full py-2 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-800 font-semibold text-[11px] transition-colors mt-1"
                >
                  Request Reservation
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Enterprise Architecture</span>
          <h2 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            Engineered for Campus Reliability
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Explainable Recommendation Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminate venue mismatches. Our engine pairs your audience size, required microphones, laser projectors, and preferred blocks with transparent match percentages.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Atomic Overlap & Conflict Guard</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Two faculty members or student leads can never double-book the same hall. Database transaction locks re-validate availability during final review.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">QR Check-in & .ics Calendar Export</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Approved organizers receive a verifiable check-in pass and one-click iCalendar exports compatible with Google Calendar, Apple Calendar, and Outlook.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}
