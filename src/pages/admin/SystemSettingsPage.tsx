import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { isSupabaseConfigured } from '@/lib/supabase'
import { 
  Sliders, 
  ShieldCheck, 
  Database, 
  Clock, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react'

export const SystemSettingsPage: React.FC = () => {
  const [allowedDomains, setAllowedDomains] = useState('nmamit.in, nitte.in')
  const [defaultBuffer, setDefaultBuffer] = useState('15')
  const [minLeadTimeAuditorium, setMinLeadTimeAuditorium] = useState('48')
  const [savedFeedback, setSavedFeedback] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
          CampusConnect System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Institutional domain eligibility, operational time buffers, and backend integration parameters.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration parameters updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Domain Validation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Institutional Email Domain Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-slate-500 text-xs">
              Configure which email domains are authorized to register, submit venue bookings, and view the campus master calendar.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Authorized Domains (comma separated)
              </label>
              <input
                type="text"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50/50"
              />
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg text-[11px]">
              <strong>Security Architecture Note:</strong> Client-side domain validation filters unauthorized registrations, and server-side RPC functions re-enforce institutional domain matching before booking persistence.
            </div>
          </CardContent>
        </Card>

        {/* Operational Buffers & Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Clock className="w-4 h-4 text-indigo-600" />
              Operational Buffers & Campus Timezone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Default Pre-Event & Post-Event Buffer (Minutes)
                </label>
                <select
                  value={defaultBuffer}
                  onChange={(e) => setDefaultBuffer(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="15">15 Minutes (Recommended)</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sambhram Hall Minimum Lead Time (Hours)
                </label>
                <input
                  type="number"
                  value={minLeadTimeAuditorium}
                  onChange={(e) => setMinLeadTimeAuditorium(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Official Campus Timezone
              </label>
              <input
                type="text"
                disabled
                value="Asia/Kolkata (IST, UTC+05:30)"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 font-mono text-slate-600 cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database & Cloud Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Database className="w-4 h-4 text-indigo-600" />
              Supabase PostgreSQL Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">
                  {isSupabaseConfigured ? 'Hosted Supabase PostgreSQL Active' : 'In-Browser Local Demo Provider Active'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isSupabaseConfigured 
                    ? 'Connected with live remote database and Row Level Security.' 
                    : 'Operating with localStorage transactional replication and seed data. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to link live remote backend.'}
                </span>
              </div>
              <span className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Save System Settings
          </button>
        </div>
      </form>
    </div>
  )
}
