import React, { useState, useEffect, useMemo } from 'react'
import { Venue, Booking, BookingEquipmentRequirement, EventCategory, EventVisibility, VenueBlock } from '@/types'
import { getSmartVenueRecommendations, generateAlternativeSlots } from '@/lib/recommendations'
import { createBookingRequest } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { formatDateIST, formatTimeIST } from '@/lib/utils'
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Send,
  Building2,
  SlidersHorizontal,
  Info,
  Lock
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface BookingWizardProps {
  venues: Venue[]
  allBookings: Booking[]
  initialVenueId?: string
  initialDate?: string
  initialTime?: string
  onComplete: (booking: Booking) => void
  onCancel: () => void
}

const EQUIPMENT_OPTIONS = [
  'Projector and display screen',
  'Wireless microphone',
  'Wired microphone',
  'Speakers and sound system',
  'Air conditioning',
  'Whiteboard',
  'Video conferencing equipment',
  'Recording equipment',
  'Podium',
  'Wi-Fi'
]

export const BookingWizard: React.FC<BookingWizardProps> = ({
  venues,
  allBookings,
  initialVenueId,
  initialDate,
  initialTime,
  onComplete,
  onCancel
}) => {
  const { currentUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState<Booking | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Default date to tomorrow if none provided
  const defaultDate = useMemo(() => {
    if (initialDate) return initialDate
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [initialDate])

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Event Details
    eventTitle: '',
    eventCategory: 'seminar' as EventCategory,
    eventDescription: '',
    department: currentUser?.department || 'Department of Computer Science & Engineering',
    organizerName: currentUser?.fullName || 'Faculty Organizer',
    organizerEmail: currentUser?.email || 'organizer@nmamit.in',
    organizerPhone: currentUser?.phone || '+91 98450 12345',
    expectedAttendees: 75,
    visibility: 'campus_only' as EventVisibility,
    additionalNotes: '',

    // Step 2: Date & Time
    requestedDate: defaultDate,
    requestedStart: initialTime || '10:00',
    requestedEnd: '13:00',
    setupBufferMinutes: 15,
    teardownBufferMinutes: 15,

    // Step 3: Requirements
    preferredBlock: 'Any' as VenueBlock | 'Any',
    preferredVenueId: initialVenueId || '',
    equipmentMandatory: ['Projector and display screen', 'Air conditioning'] as string[],
    equipmentOptional: ['Wireless microphone', 'Speakers and sound system'] as string[],
    requiresAccessibility: false,

    // Step 4: Selected Venue
    selectedVenueId: initialVenueId || ''
  })

  // Synchronize organizer details whenever currentUser is loaded or updated
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        organizerName: currentUser.fullName || prev.organizerName,
        organizerEmail: currentUser.email || prev.organizerEmail,
        department: currentUser.department || prev.department,
        organizerPhone: currentUser.phone || prev.organizerPhone,
      }))
    }
  }, [currentUser])

  // Calculate recommendation matches in real-time
  const recommendations = useMemo(() => {
    const equipReqs: BookingEquipmentRequirement[] = [
      ...formData.equipmentMandatory.map(name => ({ name, isMandatory: true })),
      ...formData.equipmentOptional.map(name => ({ name, isMandatory: false }))
    ]

    return getSmartVenueRecommendations(
      {
        expectedAttendees: formData.expectedAttendees,
        date: formData.requestedDate,
        startTime: formData.requestedStart,
        endTime: formData.requestedEnd,
        setupMinutes: formData.setupBufferMinutes,
        teardownMinutes: formData.teardownBufferMinutes,
        eventCategory: formData.eventCategory,
        preferredBlock: formData.preferredBlock,
        preferredVenueId: formData.preferredVenueId,
        equipmentRequirements: equipReqs,
        requiresAccessibility: formData.requiresAccessibility
      },
      venues,
      allBookings
    )
  }, [formData, venues, allBookings])

  // Automatically select the top available recommendation if none selected yet
  useEffect(() => {
    if (currentStep === 4 && !formData.selectedVenueId && recommendations.length > 0) {
      const best = recommendations.find(r => r.isAvailable)
      if (best) {
        setFormData(prev => ({ ...prev, selectedVenueId: best.venue.id }))
      }
    }
  }, [currentStep, recommendations, formData.selectedVenueId])

  // Conflict alternative suggestions
  const selectedVenue = venues.find(v => v.id === formData.selectedVenueId)
  const selectedRec = recommendations.find(r => r.venue.id === formData.selectedVenueId)
  const hasConflict = selectedRec ? !selectedRec.isAvailable : false

  const alternativeSlots = useMemo(() => {
    if (!selectedVenue) return []
    return generateAlternativeSlots(
      selectedVenue,
      formData.requestedDate,
      formData.requestedStart,
      formData.requestedEnd,
      allBookings,
      venues.filter(v => v.id !== selectedVenue.id)
    )
  }, [selectedVenue, formData.requestedDate, formData.requestedStart, formData.requestedEnd, allBookings, venues])

  // Step Validation
  const validateStep = (step: number): boolean => {
    setFormError(null)

    if (step === 1) {
      if (!formData.eventTitle.trim()) {
        setFormError('Please provide an event title.')
        return false
      }
      if (!formData.eventDescription.trim()) {
        setFormError('Detailed purpose and description is required for administrator approval.')
        return false
      }
      if (formData.expectedAttendees <= 0) {
        setFormError('Please specify a valid expected audience count.')
        return false
      }
      return true
    }

    if (step === 2) {
      const todayStr = new Date().toISOString().split('T')[0]
      if (formData.requestedDate < todayStr) {
        setFormError('Event date cannot be in the past.')
        return false
      }
      const [sh, sm] = formData.requestedStart.split(':').map(Number)
      const [eh, em] = formData.requestedEnd.split(':').map(Number)
      if (eh * 60 + em <= sh * 60 + sm) {
        setFormError('Event end time must be after start time.')
        return false
      }
      return true
    }

    if (step === 3) {
      return true
    }

    if (step === 4) {
      if (!formData.selectedVenueId) {
        setFormError('Please select a recommended venue.')
        return false
      }
      if (hasConflict) {
        // Must resolve conflict in Step 5
        setCurrentStep(5)
        return false
      }
      return true
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4 && hasConflict) {
        setCurrentStep(5) // Move to conflict alternative resolver
      } else if (currentStep === 4 && !hasConflict) {
        setCurrentStep(6) // Skip to review step directly if no conflict!
      } else {
        setCurrentStep(prev => Math.min(6, prev + 1))
      }
    }
  }

  const handleBack = () => {
    setFormError(null)
    if (currentStep === 6 && !hasConflict) {
      setCurrentStep(4)
    } else {
      setCurrentStep(prev => Math.max(1, prev - 1))
    }
  }

  const handleSubmit = async () => {
    if (!currentUser) return
    setIsSubmitting(true)
    setFormError(null)

    // Calculate buffered start and end
    const [sh, sm] = formData.requestedStart.split(':').map(Number)
    const [eh, em] = formData.requestedEnd.split(':').map(Number)
    const setupStartMin = Math.max(0, sh * 60 + sm - formData.setupBufferMinutes)
    const cleanupEndMin = Math.min(24 * 60 - 1, eh * 60 + em + formData.teardownBufferMinutes)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const setupStartStr = `${pad(Math.floor(setupStartMin / 60))}:${pad(setupStartMin % 60)}`
    const cleanupEndStr = `${pad(Math.floor(cleanupEndMin / 60))}:${pad(cleanupEndMin % 60)}`

    const equipmentPayload: BookingEquipmentRequirement[] = [
      ...formData.equipmentMandatory.map(name => ({ name, isMandatory: true })),
      ...formData.equipmentOptional.map(name => ({ name, isMandatory: false }))
    ]

    const result = await createBookingRequest({
      organizerId: currentUser.id,
      organizerName: currentUser?.fullName || formData.organizerName,
      organizerEmail: currentUser?.email || formData.organizerEmail,
      organizerPhone: formData.organizerPhone,
      department: formData.department,
      eventTitle: formData.eventTitle,
      eventDescription: formData.eventDescription,
      eventCategory: formData.eventCategory,
      expectedAttendees: formData.expectedAttendees,
      visibility: formData.visibility,
      requestedVenueId: formData.selectedVenueId,
      requestedDate: formData.requestedDate,
      requestedStart: formData.requestedStart,
      requestedEnd: formData.requestedEnd,
      setupStart: setupStartStr,
      cleanupEnd: cleanupEndStr,
      equipment: equipmentPayload,
      additionalNotes: formData.additionalNotes
    })

    setIsSubmitting(false)

    if (result.success && result.booking) {
      setSubmissionSuccess(result.booking)
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      })
    } else {
      setFormError(result.error || 'Failed to submit booking request.')
    }
  }

  const steps = [
    { number: 1, label: 'Event Details' },
    { number: 2, label: 'Date & Time' },
    { number: 3, label: 'Requirements' },
    { number: 4, label: 'Smart Matches' },
    { number: 5, label: 'Conflict Resolver' },
    { number: 6, label: 'Review & Submit' }
  ]

  // Success Confirmation Screen
  if (submissionSuccess) {
    const assignedVenue = venues.find(v => v.id === submissionSuccess.requestedVenueId)
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-8 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Initial Status: Pending Approval
          </span>
          <h2 className="text-2xl font-bold font-heading text-slate-900 mt-3">
            Booking Request Submitted Successfully!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Your request has been routed to the Dean of Student Affairs and Campus Facilities Administration.
          </p>
        </div>

        {/* Reference Code Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Booking Reference Code:</span>
            <span className="font-mono font-bold text-sm text-indigo-900">{submissionSuccess.referenceCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Event Title:</span>
            <span className="font-semibold text-slate-900">{submissionSuccess.eventTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Venue Requested:</span>
            <span className="font-semibold text-slate-900">{assignedVenue?.name} ({assignedVenue?.block})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Date & Slot:</span>
            <span className="font-semibold text-slate-900">
              {formatDateIST(submissionSuccess.requestedDate)} • {formatTimeIST(submissionSuccess.requestedStart)} - {formatTimeIST(submissionSuccess.requestedEnd)}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onComplete(submissionSuccess)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            Go to My Bookings
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Wizard Header & Progress Bar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Smart Venue Booking Wizard
            </h2>
            <p className="text-xs text-slate-500">
              Step {currentStep} of 6: {steps[currentStep - 1].label}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Visual Step Indicator */}
        <div className="grid grid-cols-6 gap-2">
          {steps.map((s) => {
            const isCompleted = s.number < currentStep
            const isCurrent = s.number === currentStep
            return (
              <div key={s.number} className="flex flex-col gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-indigo-600 ring-2 ring-indigo-200'
                      : 'bg-slate-200'
                  }`}
                />
                <span className={`text-[10px] hidden sm:block font-medium truncate ${
                  isCurrent ? 'text-indigo-900 font-bold' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error alert if any */}
      {formError && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Wizard Body by Step */}
      <div className="p-6">
        {/* ================= STEP 1: EVENT DETAILS ================= */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.eventTitle}
                onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                placeholder="e.g. National Symposium on Artificial Intelligence & Ethics"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Event Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.eventCategory}
                  onChange={(e) => setFormData({ ...formData, eventCategory: e.target.value as EventCategory })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="seminar">Seminar / Symposium</option>
                  <option value="workshop">Hands-on Workshop</option>
                  <option value="technical_event">Technical Event / Hackathon</option>
                  <option value="cultural_event">Cultural Activity</option>
                  <option value="club_activity">Student Club Activity</option>
                  <option value="guest_lecture">Distinguished Guest Lecture</option>
                  <option value="conference">National / International Conference</option>
                  <option value="meeting">Department / Administrative Meeting</option>
                  <option value="other">Other Campus Gathering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Expected Audience Size <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={formData.expectedAttendees}
                  onChange={(e) => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used by our smart recommendation engine to pick optimal venues.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Detailed Purpose & Event Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.eventDescription}
                onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
                placeholder="Explain the academic or institutional objective, keynote guests, and why campus infrastructure is requested..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Organizing Department / Student Club <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Audience Scope / Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as EventVisibility })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="campus_only">Open to All NMAMIT Campus Members</option>
                  <option value="public">Public / Open Inter-Collegiate</option>
                  <option value="private_invited">Restricted to Invited Participants Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Organizer Name</label>
                  {currentUser && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      Locked
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={currentUser ? (currentUser.fullName || formData.organizerName) : formData.organizerName}
                  readOnly={!!currentUser}
                  disabled={!!currentUser}
                  onChange={(e) => {
                    if (!currentUser) {
                      setFormData({ ...formData, organizerName: e.target.value })
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    currentUser
                      ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none font-medium'
                      : 'border-slate-200 bg-slate-50/50 text-slate-800'
                  }`}
                  title={currentUser ? "Organizer name is fixed to your logged-in account and cannot be modified." : undefined}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Institutional Email</label>
                  {currentUser && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      Verified
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={currentUser ? (currentUser.email || formData.organizerEmail) : formData.organizerEmail}
                  readOnly={!!currentUser}
                  disabled={!!currentUser}
                  onChange={(e) => {
                    if (!currentUser) {
                      setFormData({ ...formData, organizerEmail: e.target.value })
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    currentUser
                      ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none font-medium'
                      : 'border-slate-200 bg-slate-50/50 text-slate-800'
                  }`}
                  title={currentUser ? "Institutional email is fixed to your logged-in account." : undefined}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.organizerPhone}
                  onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DATE AND TIME ================= */}
        {currentStep === 2 && (
          <div className="space-y-5 max-w-2xl">
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Setup and Teardown Buffers:</span>
                Campus policy automatically reserves buffer windows before and after your event to prevent consecutive operational conflicts.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Event Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.requestedDate}
                onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.requestedStart}
                  onChange={(e) => setFormData({ ...formData, requestedStart: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  End Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.requestedEnd}
                  onChange={(e) => setFormData({ ...formData, requestedEnd: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Setup Buffer (Pre-Event)
                </label>
                <select
                  value={formData.setupBufferMinutes}
                  onChange={(e) => setFormData({ ...formData, setupBufferMinutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value={15}>15 Minutes (Standard)</option>
                  <option value={30}>30 Minutes (Stage Setup)</option>
                  <option value={60}>60 Minutes (Audio/Visual Calibration)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teardown Buffer (Post-Event)
                </label>
                <select
                  value={formData.teardownBufferMinutes}
                  onChange={(e) => setFormData({ ...formData, teardownBufferMinutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value={15}>15 Minutes (Standard)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Stage Dismantling)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: REQUIREMENTS ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-3xl">
            {/* Preferred Block & Venue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Preferred Campus Block
                </label>
                <select
                  value={formData.preferredBlock}
                  onChange={(e) => setFormData({ ...formData, preferredBlock: e.target.value as VenueBlock | 'Any' })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Any">No Block Preference (Best Match)</option>
                  <option value="APJ Kalam Block">APJ Kalam Block</option>
                  <option value="Ramanujan Block">Ramanujan Block</option>
                  <option value="Academic Administration Block">Academic Administration Block</option>
                  <option value="Innovation and Research Block">Innovation and Research Block</option>
                  <option value="Central Campus">Central Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Optional Preferred Venue
                </label>
                <select
                  value={formData.preferredVenueId}
                  onChange={(e) => setFormData({ ...formData, preferredVenueId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Let Recommendation Engine Pick Best Fit</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.block})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mandatory Equipment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 block">
                  Mandatory Equipment (Hard Requirement)
                </label>
                <span className="text-[11px] text-slate-400">Venues missing these will be excluded</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map((item) => {
                  const isChecked = formData.equipmentMandatory.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setFormData({
                            ...formData,
                            equipmentMandatory: formData.equipmentMandatory.filter(e => e !== item)
                          })
                        } else {
                          setFormData({
                            ...formData,
                            equipmentMandatory: [...formData.equipmentMandatory, item],
                            equipmentOptional: formData.equipmentOptional.filter(e => e !== item)
                          })
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-1">{item}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Optional Equipment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 block">
                  Optional Equipment / Nice-to-have
                </label>
                <span className="text-[11px] text-slate-400">Boosts suitability ranking score</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map((item) => {
                  const isMandatory = formData.equipmentMandatory.includes(item)
                  const isChecked = formData.equipmentOptional.includes(item)
                  if (isMandatory) return null
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setFormData({
                            ...formData,
                            equipmentOptional: formData.equipmentOptional.filter(e => e !== item)
                          })
                        } else {
                          setFormData({
                            ...formData,
                            equipmentOptional: [...formData.equipmentOptional, item]
                          })
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-teal-50 border-teal-400 text-teal-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-1">{item}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Accessibility Checkbox */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <input
                type="checkbox"
                id="acc-req"
                checked={formData.requiresAccessibility}
                onChange={(e) => setFormData({ ...formData, requiresAccessibility: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="acc-req" className="text-xs text-slate-700 cursor-pointer">
                <strong>Requires Wheelchair Accessibility & Stage Ramp:</strong> Only show venues with verified ADA/elevator & stage access.
              </label>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SMART RECOMMENDATIONS ================= */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Smart Venue Match Results ({recommendations.length} Evaluated)
                </h3>
                <p className="text-xs text-slate-500">
                  Ranked by capacity efficiency, mandatory equipment, block preference, and conflict status.
                </p>
              </div>
              <div className="text-xs font-semibold text-indigo-700">
                Audience: {formData.expectedAttendees} Attendees
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">No Venues Match All Mandatory Requirements</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  No venue on campus can accommodate {formData.expectedAttendees} attendees with your requested mandatory gear during operating hours.
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Modify Equipment or Capacity
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec) => {
                  const isSelected = formData.selectedVenueId === rec.venue.id
                  return (
                    <div
                      key={rec.venue.id}
                      onClick={() => setFormData({ ...formData, selectedVenueId: rec.venue.id })}
                      className={`rounded-xl border p-4 cursor-pointer transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-md'
                          : rec.isAvailable
                          ? 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                          : 'border-rose-200 bg-rose-50/20 opacity-90'
                      }`}
                    >
                      <div>
                        {/* Top Bar: Match Score + Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold ${
                              rec.suitabilityScore >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.suitabilityScore >= 60
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {rec.suitabilityScore}% Match
                            </span>
                            {!rec.venue.isDemoVenue && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                                NMAMIT Real
                              </span>
                            )}
                          </div>

                          {rec.isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Time Conflict
                            </span>
                          )}
                        </div>

                        {/* Title and Block */}
                        <h4 className="font-bold text-sm text-slate-900">{rec.venue.name}</h4>
                        <span className="text-xs text-slate-500 block mb-2">{rec.venue.block} • {rec.venue.venueType}</span>

                        {/* Capacity gauge */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                            <span>Audience ({formData.expectedAttendees}) vs Capacity ({rec.venue.maxCapacity})</span>
                            <span className="font-bold">{Math.round(rec.capacityMatchRatio * 100)}% utilization</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rec.capacityMatchRatio > 0.95
                                  ? 'bg-rose-500'
                                  : rec.capacityMatchRatio >= 0.6
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, rec.capacityMatchRatio * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Transparent Explanation */}
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed mb-3">
                          {rec.explanation}
                        </p>

                        {/* Positive factors checklist */}
                        <div className="space-y-1 mb-2">
                          {rec.positiveFactors.map((fact, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{fact}</span>
                            </div>
                          ))}
                          {rec.concerns.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-rose-700">
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Select Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFormData({ ...formData, selectedVenueId: rec.venue.id })
                        }}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-colors mt-2 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Selected Venue' : 'Select Venue'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 5: CONFLICT DETECTOR & ALTERNATIVE SLOTS ================= */}
        {currentStep === 5 && (
          <div className="space-y-5 max-w-2xl">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Scheduling Conflict Detected</span>
              </div>
              <p>
                <strong>{selectedVenue?.name}</strong> is currently reserved by another confirmed campus booking during your requested time slot ({formData.requestedStart} - {formData.requestedEnd}) on {formatDateIST(formData.requestedDate)}.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Intelligent Alternative Suggestions
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Click any conflict-free alternative below to instantly update your booking schedule without losing any details:
              </p>

              <div className="space-y-2.5">
                {alternativeSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-200">
                    No immediate nearby slots found. Please try a different date or explore other venues.
                  </p>
                ) : (
                  alternativeSlots.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900">{alt.venueName}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available Slot
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            {formatDateIST(alt.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            {alt.startTime} - {alt.endTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{alt.reason}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            selectedVenueId: alt.venueId,
                            requestedDate: alt.date,
                            requestedStart: alt.startTime,
                            requestedEnd: alt.endTime
                          })
                          setCurrentStep(6) // Proceed straight to review!
                        }}
                        className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                      >
                        Apply Alternative
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manual Date/Time Adjustment option */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">Or manually adjust your date and time:</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={formData.requestedDate}
                  onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="time"
                  value={formData.requestedStart}
                  onChange={(e) => setFormData({ ...formData, requestedStart: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="time"
                  value={formData.requestedEnd}
                  onChange={(e) => setFormData({ ...formData, requestedEnd: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-xs font-semibold text-indigo-600 hover:underline mt-1 block"
              >
                ← Recalculate Recommendations
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 6: REVIEW AND SUBMIT ================= */}
        {currentStep === 6 && (
          <div className="space-y-6 max-w-3xl">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Final Booking Request Summary
              </h3>
              <p className="text-xs text-slate-500">
                Please verify all event specifications before submitting for administrative clearance.
              </p>
            </div>

            {/* Review Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Event Details Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Event Details</span>
                  <button onClick={() => setCurrentStep(1)} className="text-indigo-600 hover:underline text-[11px]">Edit</button>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Title</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.eventTitle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Category & Scope</span>
                  <span className="capitalize font-semibold text-slate-800">
                    {formData.eventCategory.replace('_', ' ')} • {formData.visibility.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Audience Size</span>
                  <span className="font-semibold text-slate-800">{formData.expectedAttendees} Attendees</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Purpose</span>
                  <span className="text-slate-600 line-clamp-2">{formData.eventDescription}</span>
                </div>
              </div>

              {/* Venue & Schedule Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Venue & Timings</span>
                  <button onClick={() => setCurrentStep(2)} className="text-indigo-600 hover:underline text-[11px]">Edit</button>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Venue</span>
                  <span className="font-bold text-indigo-900 text-sm">{selectedVenue?.name}</span>
                  <span className="text-slate-500 block text-[11px]">{selectedVenue?.block}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Event Date</span>
                  <span className="font-semibold text-slate-800">{formatDateIST(formData.requestedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Timings & Reserved Buffers</span>
                  <span className="font-semibold text-slate-800">
                    {formatTimeIST(formData.requestedStart)} - {formatTimeIST(formData.requestedEnd)}
                  </span>
                  <span className="text-slate-500 block text-[10px]">
                    Includes {formData.setupBufferMinutes}m setup & {formData.teardownBufferMinutes}m cleanup
                  </span>
                </div>
              </div>

              {/* Equipment Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 md:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Requested AV Equipment</span>
                  <button onClick={() => setCurrentStep(3)} className="text-indigo-600 hover:underline text-[11px]">Edit</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.equipmentMandatory.map((eq, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {eq} (Mandatory)
                    </span>
                  ))}
                  {formData.equipmentOptional.map((eq, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                      {eq} (Optional)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Institutional Rules Acceptance */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-1">NMAMIT Campus Facilities Policy:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li>Upon submission, booking requests enter the <strong>Pending Approval</strong> state.</li>
                <li>The administrator reviews audience capacity, speaker technical setup, and calendar conflicts before confirming.</li>
                <li>You will receive an automated in-app notification once the Dean or Facilities Admin reviews your booking.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Footer */}
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors ${
            currentStep === 1 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Booking Request
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
