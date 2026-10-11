import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Modal } from './Modal'
import { Booking } from '@/types'
import { QrCode, ShieldCheck, Download, Calendar, Clock, MapPin } from 'lucide-react'
import { formatDateIST, formatTimeIST } from '@/lib/utils'

interface QrCodeModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  venueName: string
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  booking,
  venueName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (isOpen && booking && canvasRef.current) {
      const payload = JSON.stringify({
        ref: booking.referenceCode,
        token: booking.qrCheckInToken || 'TOKEN_VALID_NMAMIT',
        event: booking.eventTitle,
        venue: venueName,
        date: booking.requestedDate,
        org: booking.organizerName
      })

      QRCode.toCanvas(canvasRef.current, payload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('Error generating QR code:', error)
      })
    }
  }, [isOpen, booking, venueName])

  if (!booking) return null

  const handleDownloadQR = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `QR-Pass-${booking.referenceCode}.png`
    a.click()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Admission & Check-in Pass"
      description="Authorized electronic access credential issued by NMAMIT Campus Facilities."
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center">
        {/* QR Canvas Container with Card styling */}
        <div className="p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-md mb-4 flex flex-col items-center">
          <canvas ref={canvasRef} className="rounded-lg shadow-xs" />
          <div className="mt-2 text-xs font-mono font-bold text-indigo-900 tracking-wider">
            {booking.referenceCode}
          </div>
        </div>

        {/* Security verification stamp */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified Institutional Reservation
        </div>

        {/* Summary Details */}
        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 mb-5 text-xs text-slate-700">
          <div>
            <span className="font-semibold text-slate-900 block text-sm mb-1">{booking.eventTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span><strong>Venue:</strong> {venueName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span><strong>Date:</strong> {formatDateIST(booking.requestedDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span><strong>Time:</strong> {formatTimeIST(booking.requestedStart)} - {formatTimeIST(booking.requestedEnd)}</span>
          </div>
          <div className="text-slate-500 pt-1 border-t border-slate-200">
            <strong>Organizer:</strong> {booking.organizerName} ({booking.department})
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3">
          <button
            onClick={handleDownloadQR}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Save QR Pass Image
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
