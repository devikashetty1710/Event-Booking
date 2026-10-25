import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { localStore } from '@/lib/storage'
import { clearEventHistoryDB } from '@/lib/eventHistoryDB'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Shield, 
  RotateCcw, 
  CheckCircle2, 
  KeyRound,
  LogOut
} from 'lucide-react'

export const ProfileSettingsPage: React.FC = () => {
  const { currentUser, logout } = useAuth()
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)

  const handleResetData = async () => {
    if (window.confirm('Reset all venues, bookings, and database event history back to initial clean state?')) {
      localStore.resetAll()
      await clearEventHistoryDB()
      setResetFeedback('Clean database reset successfully. Refreshing...')
      setTimeout(() => {
        window.location.reload()
      }, 800)
    }
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
          Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your institutional identity, role authorization, and credential status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h2>
                  <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                    {currentUser.role === 'admin' ? 'ADMINISTRATOR' : 'ORGANIZER'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <p className="text-xs font-semibold text-blue-900">{currentUser.department}</p>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-blue-900" />
                  <span className="font-semibold">Domain Verification</span>
                </div>
                <span className="text-slate-900 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Authorized Institutional Account
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="font-semibold">Access Level</span>
                </div>
                <span className="text-slate-900 font-bold">
                  {currentUser.role === 'admin' ? 'Campus Facilities Administrator' : 'Event Organizer (Booking Rights)'}
                </span>
              </div>
            </div>
          </Card>

          {/* Account Switching Security Notice */}
          <Card className="p-5 bg-white border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-700" />
              Role Authorization & Credentials
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with campus security policies, accounts cannot be arbitrarily switched via quick toggles. To log in as an Administrator or a different Organizer, please use the <strong>Sign Out</strong> button below and sign in with the target account credentials.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Currently active as: <strong>{currentUser.email}</strong></span>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Database Utilities */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-600" />
              Database Reset
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Clear all booking requests and event history database records to start fresh from a blank slate.
            </p>

            {resetFeedback && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg mb-3">
                {resetFeedback}
              </div>
            )}

            <button
              onClick={handleResetData}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Data
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
