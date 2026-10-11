import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin,
  Sparkles
} from 'lucide-react'

export const HelpGuidelinesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
          NMAMIT Campus Booking Guidelines & AV Protocols
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official policies governing seminar halls, auditoriums, sound levels, and administrative lead times.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Lead Times & Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Reservation Lead Time Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-slate-600">
            <p>
              <strong>Auditorium (Sambhram Hall):</strong> Minimum <strong>48 hours</strong> prior to event date. Requires coordination with campus electrician and sound technician.
            </p>
            <p>
              <strong>Seminar Halls (Nandini & Shambavi):</strong> Minimum <strong>24 hours</strong> prior.
            </p>
            <p>
              <strong>Academic Review Meetings:</strong> Conference rooms may be booked up to <strong>12 hours</strong> in advance.
            </p>
            <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
              Emergency university senate or accreditation review meetings take highest administrative priority.
            </p>
          </CardContent>
        </Card>

        {/* Technical AV & Sound Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Audio-Visual & Equipment Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-slate-600">
            <p>
              <strong>Stage Buffers:</strong> All bookings include an automatic 15-minute setup and teardown buffer to allow technical handover.
            </p>
            <p>
              <strong>Campus Quiet Hours:</strong> Outdoor events in the Open-Air Amphitheatre must keep decibel levels below 65 dB and conclude by <strong>20:30 PM</strong>.
            </p>
            <p>
              <strong>Laser Projector Care:</strong> Do not disconnect power cords directly. Use the lectern touch control panel to power down projectors.
            </p>
          </CardContent>
        </Card>

        {/* Cancellation and Discipline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Cancellation & Housekeeping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-slate-600">
            <p>
              <strong>Notice of Cancellation:</strong> If an event is cancelled or postponed, please cancel through "My Bookings" at least <strong>6 hours</strong> prior to release space.
            </p>
            <p>
              <strong>Clean Campus Protocol:</strong> Food and beverages are strictly prohibited inside Nandini, Shambavi, Sambhram, and Phalguni halls. Catering must be stationed in foyers.
            </p>
          </CardContent>
        </Card>

        {/* Contact Helpdesk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              Campus Facilities Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>facilities@nmamit.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Ext. 263 / 264 (Campus Facilities Desk)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Room 102, Academic Administration Block</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
