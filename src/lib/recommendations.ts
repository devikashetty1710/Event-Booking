import { Venue, Booking, BookingEquipmentRequirement, VenueRecommendation, AlternativeSlotSuggestion, VenueBlock, EventCategory } from '@/types'

/**
 * Checks if two time intervals overlap (including setup and cleanup buffers).
 */
export function doIntervalsOverlap(
  startA: string, // "HH:mm" or ISO
  endA: string,   // "HH:mm" or ISO
  startB: string,
  endB: string
): boolean {
  // Convert to minutes from midnight if HH:mm
  const toMinutes = (time: string): number => {
    if (time.includes('T')) {
      const parts = time.split('T')[1].substring(0, 5).split(':')
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
    }
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const aStartMin = toMinutes(startA)
  const aEndMin = toMinutes(endA)
  const bStartMin = toMinutes(startB)
  const bEndMin = toMinutes(endB)

  return Math.max(aStartMin, bStartMin) < Math.min(aEndMin, bEndMin)
}

/**
 * Check if a venue is available for a given date and time range.
 */
export function checkVenueAvailability(
  venueId: string,
  date: string,
  startTime: string,
  endTime: string,
  setupBufferMinutes: number = 15,
  teardownBufferMinutes: number = 15,
  allBookings: Booking[] = [],
  excludeBookingId?: string
): { isAvailable: boolean; conflictingBooking?: Booking; reason?: string } {
  // Calculate buffered start and end
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  
  const startTotalMinutes = Math.max(0, sh * 60 + sm - setupBufferMinutes)
  const endTotalMinutes = Math.min(24 * 60 - 1, eh * 60 + em + teardownBufferMinutes)

  const pad = (n: number) => n.toString().padStart(2, '0')
  const bufferedStart = `${pad(Math.floor(startTotalMinutes / 60))}:${pad(startTotalMinutes % 60)}`
  const bufferedEnd = `${pad(Math.floor(endTotalMinutes / 60))}:${pad(endTotalMinutes % 60)}`

  // Filter approved or under-review bookings for this venue and date
  for (const b of allBookings) {
    if (b.id === excludeBookingId) continue
    const assigned = b.assignedVenueId || b.requestedVenueId
    if (assigned !== venueId) continue
    if (b.requestedDate !== date) continue
    
    // Only blocking statuses
    if (b.status !== 'Approved' && b.status !== 'Under Review') continue

    // Use buffered times if provided
    const bookingStart = b.setupStart || b.requestedStart
    const bookingEnd = b.cleanupEnd || b.requestedEnd

    if (doIntervalsOverlap(bufferedStart, bufferedEnd, bookingStart, bookingEnd)) {
      return {
        isAvailable: false,
        conflictingBooking: b,
        reason: `Reserved for "${b.eventTitle}" (${b.requestedStart} - ${b.requestedEnd})`
      }
    }
  }

  return { isAvailable: true }
}

export interface RecommendationQueryParams {
  expectedAttendees: number
  date: string
  startTime: string
  endTime: string
  setupMinutes?: number
  teardownMinutes?: number
  eventCategory?: EventCategory
  preferredBlock?: VenueBlock | 'Any'
  preferredVenueId?: string
  equipmentRequirements?: BookingEquipmentRequirement[]
  requiresAccessibility?: boolean
}

/**
 * Smart recommendation engine with explainable criteria.
 */
export function getSmartVenueRecommendations(
  params: RecommendationQueryParams,
  venues: Venue[],
  allBookings: Booking[]
): VenueRecommendation[] {
  const {
    expectedAttendees,
    date,
    startTime,
    endTime,
    setupMinutes = 15,
    teardownMinutes = 15,
    eventCategory,
    preferredBlock,
    preferredVenueId,
    equipmentRequirements = [],
    requiresAccessibility = false
  } = params

  const mandatoryEquip = equipmentRequirements.filter(e => e.isMandatory).map(e => e.name.toLowerCase())
  const optionalEquip = equipmentRequirements.filter(e => !e.isMandatory).map(e => e.name.toLowerCase())

  const recommendations: VenueRecommendation[] = []

  for (const venue of venues) {
    if (!venue.isActive || venue.maintenanceStatus !== 'normal') {
      continue
    }

    // Check operating hours
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const venueStart = toMin(venue.operatingHours.start)
    const venueEnd = toMin(venue.operatingHours.end)
    const reqStart = toMin(startTime)
    const reqEnd = toMin(endTime)

    if (reqStart < venueStart || reqEnd > venueEnd) {
      continue // Outside operating hours
    }

    // Hard check: capacity
    if (venue.maxCapacity < expectedAttendees) {
      continue // Cannot physically accommodate attendees
    }

    // Hard check: mandatory equipment
    const venueEquipLower = venue.equipment.map(e => e.toLowerCase())
    const missingMandatory = mandatoryEquip.filter(
      req => !venueEquipLower.some(ve => ve.includes(req) || req.includes(ve))
    )
    if (missingMandatory.length > 0) {
      continue // Missing mandatory gear
    }

    // Hard check: accessibility if required
    if (requiresAccessibility && venue.accessibilityFeatures.length === 0) {
      continue
    }

    // Availability check
    const availCheck = checkVenueAvailability(
      venue.id,
      date,
      startTime,
      endTime,
      setupMinutes,
      teardownMinutes,
      allBookings
    )

    // Calculate suitability score (0-100)
    let score = 50
    const positiveFactors: string[] = []
    const concerns: string[] = []

    // 1. Capacity Match
    const capacityRatio = expectedAttendees / venue.maxCapacity
    if (capacityRatio >= 0.7 && capacityRatio <= 0.95) {
      score += 25
      positiveFactors.push(`Optimal capacity sizing (${Math.round(capacityRatio * 100)}% utilization)`)
    } else if (capacityRatio >= 0.4 && capacityRatio < 0.7) {
      score += 15
      positiveFactors.push(`Comfortable audience buffer for ${expectedAttendees} guests`)
    } else if (capacityRatio < 0.3) {
      score -= 10
      concerns.push(`Space may feel oversized for ${expectedAttendees} attendees (Capacity: ${venue.maxCapacity})`)
    }

    // 2. Preferred Block
    if (preferredBlock && preferredBlock !== 'Any') {
      if (venue.block === preferredBlock) {
        score += 15
        positiveFactors.push(`Located in your preferred block: ${venue.block}`)
      }
    }

    // 3. Preferred Venue
    if (preferredVenueId && venue.id === preferredVenueId) {
      score += 10
      positiveFactors.push('Matches your preferred venue selection')
    }

    // 4. Optional equipment match
    if (optionalEquip.length > 0) {
      const matchedOpt = optionalEquip.filter(req =>
        venueEquipLower.some(ve => ve.includes(req) || req.includes(ve))
      )
      const optFraction = matchedOpt.length / optionalEquip.length
      score += Math.round(optFraction * 10)
      if (matchedOpt.length > 0) {
        positiveFactors.push(`Provides ${matchedOpt.length} requested optional equipment item(s)`)
      }
    }

    // 5. Category suitability
    if (eventCategory) {
      if (eventCategory === 'seminar' && venue.venueType === 'Seminar Hall') {
        score += 5
        positiveFactors.push('Purpose-built acoustic tier setup for academic seminars')
      } else if (eventCategory === 'technical_event' && venue.venueType === 'Auditorium') {
        score += 5
        positiveFactors.push('Full auditorium stage ideal for keynote presentations & demos')
      } else if (eventCategory === 'workshop' && (venue.venueType === 'Seminar Hall' || venue.venueType === 'Lab')) {
        score += 5
        positiveFactors.push('Interactive seating and AV support for workshop participants')
      }
    }

    // Conflict impact
    if (!availCheck.isAvailable) {
      score = Math.max(5, score - 50)
      concerns.push(`Time slot occupied: ${availCheck.reason}`)
    } else {
      positiveFactors.push('Conflict-free: Venue is completely open for your specified time buffer')
    }

    // Clamp score
    const finalScore = Math.min(99, Math.max(10, score))

    // Formulate explanation
    let explanation = `Fits ${expectedAttendees} attendees (${Math.round(capacityRatio * 100)}% capacity). `
    if (availCheck.isAvailable) {
      explanation += `100% available with ${setupMinutes}m setup and ${teardownMinutes}m teardown buffers in ${venue.block}.`
    } else {
      explanation += `Currently has a time clash with another campus event.`
    }

    recommendations.push({
      venue,
      suitabilityScore: finalScore,
      capacityMatchRatio: capacityRatio,
      isAvailable: availCheck.isAvailable,
      explanation,
      positiveFactors,
      concerns,
      conflictsWith: availCheck.conflictingBooking ? {
        eventTitle: availCheck.conflictingBooking.eventTitle,
        timeSlot: `${availCheck.conflictingBooking.requestedStart} - ${availCheck.conflictingBooking.requestedEnd}`
      } : undefined
    })
  }

  // Sort: Available first, then by suitability score descending
  recommendations.sort((a, b) => {
    if (a.isAvailable && !b.isAvailable) return -1
    if (!a.isAvailable && b.isAvailable) return 1
    return b.suitabilityScore - a.suitabilityScore
  })

  return recommendations
}

/**
 * Generates alternative slots when the preferred slot has conflicts.
 */
export function generateAlternativeSlots(
  targetVenue: Venue,
  date: string,
  startTime: string,
  endTime: string,
  allBookings: Booking[],
  otherAvailableVenues: Venue[] = []
): AlternativeSlotSuggestion[] {
  const suggestions: AlternativeSlotSuggestion[] = []

  // Helper to parse duration in hours
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const durationMin = (eh * 60 + em) - (sh * 60 + sm)

  // 1. Same venue, morning slot (09:00 - ...)
  const morningStart = '09:00'
  const morningEndH = 9 + Math.floor(durationMin / 60)
  const morningEndM = durationMin % 60
  const morningEnd = `${morningEndH.toString().padStart(2, '0')}:${morningEndM.toString().padStart(2, '0')}`

  if (checkVenueAvailability(targetVenue.id, date, morningStart, morningEnd, 15, 15, allBookings).isAvailable) {
    suggestions.push({
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      date,
      startTime: morningStart,
      endTime: morningEnd,
      reason: `Earlier morning slot available in ${targetVenue.name}`
    })
  }

  // 2. Same venue, afternoon slot (14:00 - ...)
  const afterStart = '14:00'
  const afterEndH = 14 + Math.floor(durationMin / 60)
  const afterEndM = durationMin % 60
  const afterEnd = `${afterEndH.toString().padStart(2, '0')}:${afterEndM.toString().padStart(2, '0')}`

  if (afterEndH <= 20 && checkVenueAvailability(targetVenue.id, date, afterStart, afterEnd, 15, 15, allBookings).isAvailable) {
    suggestions.push({
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      date,
      startTime: afterStart,
      endTime: afterEnd,
      reason: `Afternoon slot available in ${targetVenue.name}`
    })
  }

  // 3. Other suitable venues open at the requested exact time!
  for (const altVenue of otherAvailableVenues.slice(0, 3)) {
    if (altVenue.id !== targetVenue.id) {
      if (checkVenueAvailability(altVenue.id, date, startTime, endTime, 15, 15, allBookings).isAvailable) {
        suggestions.push({
          venueId: altVenue.id,
          venueName: altVenue.name,
          date,
          startTime,
          endTime,
          reason: `Available at your exact requested time (${altVenue.block})`
        })
      }
    }
  }

  // 4. Next day same time
  const nextDateObj = new Date(date)
  nextDateObj.setDate(nextDateObj.getDate() + 1)
  const nextDateStr = nextDateObj.toISOString().split('T')[0]
  if (checkVenueAvailability(targetVenue.id, nextDateStr, startTime, endTime, 15, 15, allBookings).isAvailable) {
    suggestions.push({
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      date: nextDateStr,
      startTime,
      endTime,
      reason: `Next day (${nextDateStr}) at the same requested time`
    })
  }

  return suggestions
}
