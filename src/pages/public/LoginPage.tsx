import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { INITIAL_USERS } from '@/lib/demoData'
import { 
  School, 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  UserCheck,
  Lock
} from 'lucide-react'

interface LoginPageProps {
  onLoginSuccess: (role: 'user' | 'admin') => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, loginAsDemoUser, validateDomain } = useAuth()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('Department of Computer Science & Engineering')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const isDomainValid = email.includes('@') ? validateDomain(email) : false

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim()) {
      setErrorMsg('Please enter your institutional email address.')
      return
    }

    const res = login(email, fullName, department)
    if (res.success) {
      const isDeanOrAdmin = email.toLowerCase().includes('admin') || email.toLowerCase().includes('dean')
      onLoginSuccess(isDeanOrAdmin ? 'admin' : 'user')
    } else {
      setErrorMsg(res.message || 'Access denied.')
    }
  }

  const handleDemoSelect = (userId: string) => {
    loginAsDemoUser(userId)
    const user = INITIAL_USERS.find(u => u.id === userId)
    onLoginSuccess(user?.role === 'admin' ? 'admin' : 'user')
  }

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-md">
          <School className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
          Nitte CampusConnect
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Centralized Venue Discovery & Smart Event Calendar for NMAMIT, Nitte.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            {isRegisterMode ? 'Request Institutional Account' : 'Institutional Sign-In'}
          </h2>
          <p className="text-xs text-slate-500">
            Restricted to authorized <code className="text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">@nmamit.in</code> and <code className="text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">@nitte.in</code> accounts.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
          {isRegisterMode && (
            <>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Department / Student Club</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Dept of Artificial Intelligence"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Campus Email Address</label>
              {email.includes('@') && (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                  isDomainValid ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {isDomainValid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Domain Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      Invalid Domain
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@nmamit.in or username@nitte.in"
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border transition-colors ${
                  email.includes('@') && !isDomainValid
                    ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-indigo-500/20 bg-white'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>{isRegisterMode ? 'Complete Registration' : 'Sign In with Institutional ID'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode)
                setErrorMsg(null)
              }}
              className="text-[11px] text-indigo-700 hover:underline font-semibold"
            >
              {isRegisterMode ? '← Already have an account? Sign in' : 'Need a new faculty or organizer account? Register'}
            </button>
          </div>
        </form>

        {/* 1-Click Evaluation Persona Quick Logins */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Project Evaluation Demo Accounts:</span>
          </div>

          <div className="space-y-2">
            {INITIAL_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleDemoSelect(u.id)}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block group-hover:text-indigo-900">
                      {u.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {u.email}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                  u.role === 'admin' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
                }`}>
                  {u.role === 'admin' ? 'Admin Portal' : 'Organizer'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400">
        Authentication system is architected for SAML 2.0 / OAuth institutional SSO deployment.
      </div>
    </div>
  )
}
