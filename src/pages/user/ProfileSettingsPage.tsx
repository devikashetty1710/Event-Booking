import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { INITIAL_USERS } from '@/lib/demoData'
import { localStore } from '@/lib/storage'
import { 
  User, 
  Shield, 
  Mail, 
  Building2, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles,
  Phone,
  Layers
} from 'lucide-react'

export const ProfileSettingsPage: React.FC = () => {
  const { currentUser, loginAsDemoUser, switchRole } = useAuth()
  const [resetFeedback, setResetFeedback] = useState<string | null>(null)

  const handleResetData = () => {
    if (window.confirm('Reset all venues, bookings, and notifications back to the initial NMAMIT demo seed data?')) {
      localStore.resetAll()
      setResetFeedback('Demonstration database reset successfully. Refreshing page...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
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
          Manage your institutional identity, role authorization, and demonstration environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-2 space-y-5">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white text-xl font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  currentUser.fullName.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    currentUser.role === 'admin' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
                <p className="text-xs text-indigo-700 font-semibold mt-1">{currentUser.department}</p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-700">Domain Verification</span>
                </div>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authorized Institutional Account
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-700">Access Level</span>
                </div>
                <span className="text-slate-900 font-bold capitalize">
                  {currentUser.role === 'admin' ? 'Campus Facilities Administrator' : 'Department Event Organizer'}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Demo Accounts Switcher */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1-Click Demo Evaluation Persona Switcher
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly toggle between real evaluation personas to test both student/faculty submissions and administrator approvals:
            </p>

            <div className="space-y-2.5">
              {INITIAL_USERS.map((user) => {
                const isActive = currentUser.id === user.id
                return (
                  <div
                    key={user.id}
                    onClick={() => loginAsDemoUser(user.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{user.fullName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">{user.email} • {user.department}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {isActive ? 'Active' : 'Switch'}
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Demo Database Utilities */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-600" />
              Demo Data Reset
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              If you have created multiple test bookings or modifications and want to return to the original clean NMAMIT demonstration state, click reset below.
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
              Reset Demo State
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
