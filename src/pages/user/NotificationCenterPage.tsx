import React from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { Card } from '@/components/common/Card'
import { formatDateIST } from '@/lib/utils'
import { Bell, CheckCheck, Clock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'

interface NotificationCenterPageProps {
  onNavigateBooking: (bookingId?: string) => void
}

export const NotificationCenterPage: React.FC<NotificationCenterPageProps> = ({
  onNavigateBooking
}) => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Campus Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding booking clearance, venue modifications, and administrative notes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-500">
            No notifications yet. You will be alerted when bookings are reviewed.
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              hoverable
              onClick={() => {
                markRead(notif.id)
                if (notif.bookingId) onNavigateBooking(notif.bookingId)
              }}
              className={`p-4 cursor-pointer transition-colors ${
                !notif.isRead ? 'bg-indigo-50/20 border-indigo-200' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : notif.type === 'danger'
                      ? 'bg-rose-50 text-rose-600'
                      : notif.type === 'warning'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {notif.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : notif.type === 'danger' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : notif.type === 'warning' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-slate-900 leading-tight">
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {formatDateIST(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markRead(notif.id)
                    }}
                    className="text-[11px] text-indigo-700 hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
