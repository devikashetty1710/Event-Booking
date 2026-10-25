import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  School, 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Users,
  ShieldAlert,
  KeyRound,
  UserPlus
} from 'lucide-react'

interface LoginPageProps {
  onLoginSuccess: (role: 'user' | 'admin') => void
}

type LoginTab = 'organizer-login' | 'organizer-register' | 'admin-login'

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, validateDomain } = useAuth()
  const [activeTab, setActiveTab] = useState<LoginTab>('organizer-register')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('Department of Information Science & Engineering')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isDomainValid = email.includes('@') ? validateDomain(email) : false

  const handleTabChange = (tab: LoginTab) => {
    setActiveTab(tab)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (tab === 'admin-login') {
      setEmail('admin@nmamit.in')
      setPassword('Admin@123')
    } else {
      setEmail('')
      setPassword('')
      setFullName('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email.trim()) {
      setErrorMsg('Please enter your institutional email address (@nmamit.in or @nitte.in).')
      return
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your account password.')
      return
    }

    // Registration Mode (Step 1: Organizer registers)
    if (activeTab === 'organizer-register') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name and title.')
        return
      }

      const res = login({
        email,
        password,
        fullName: fullName.trim(),
        department: department.trim(),
        targetRole: 'user',
        isRegistration: true
      })

      if (res.success && res.user) {
        setSuccessMsg(`Welcome, ${res.user.fullName}! Your organizer account has been created. Redirecting to venue portal...`)
        setTimeout(() => onLoginSuccess('user'), 700)
      } else {
        setErrorMsg(res.message || 'Registration failed.')
      }
      return
    }

    // Login for Organizer or Admin
    const targetRole = activeTab === 'admin-login' ? 'admin' : 'user'
    const res = login({
      email,
      password,
      targetRole
    })

    if (res.success && res.user) {
      if (activeTab === 'admin-login' && res.user.role !== 'admin') {
        setErrorMsg('Access Denied: This account is not authorized as an administrator.')
        return
      }
      setSuccessMsg(`Authenticated as ${res.user.role === 'admin' ? 'Campus Administrator' : 'Organizer'}. Redirecting...`)
      setTimeout(() => onLoginSuccess(res.user?.role === 'admin' ? 'admin' : 'user'), 500)
    } else {
      setErrorMsg(res.message || 'Authentication failed. Please verify your email and password.')
    }
  }

  return (
    <div className="max-w-md mx-auto my-6 space-y-5">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
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

      {/* Main Authentication Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Role Segment Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 p-1.5 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleTabChange('organizer-register')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'organizer-register'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-700" />
            <span>1. Register</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('organizer-login')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'organizer-login'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Organizer</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('admin-login')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin-login'
                ? 'bg-blue-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Step Guidance Header */}
          {activeTab === 'organizer-register' && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <UserPlus className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Step 1: Organizer Registration</strong>
                <span>Register with your NMAMIT institutional email. Once registered, you can immediately book auditoriums & seminar halls.</span>
              </div>
            </div>
          )}

          {activeTab === 'organizer-login' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Organizer Sign-In</strong>
                <span>Log in to your registered organizer account to book halls, view clearance status, and export tickets.</span>
              </div>
            </div>
          )}

          {activeTab === 'admin-login' && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Campus Administrator Portal</strong>
                <span>Administrators hold exclusive authority to accept or reject submitted booking requests and manage the database.</span>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {activeTab === 'organizer-register' && (
              <>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Full Name & Title</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Kumar / Club Lead"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Department / Student Club</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Dept of Computer Science & Engineering"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800">
                  {activeTab === 'admin-login' ? 'Administrator Institutional Email' : 'Campus Email Address'}
                </label>
                {email.includes('@') && (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    isDomainValid ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {isDomainValid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Valid Domain
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
                  placeholder={activeTab === 'admin-login' ? 'admin@nmamit.in' : 'yourname@nmamit.in or @nitte.in'}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border transition-colors ${
                    email.includes('@') && !isDomainValid
                      ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-blue-500/20 bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800">
                  {activeTab === 'organizer-register' ? 'Create Password (min. 6 characters)' : 'Password'}
                </label>
                {activeTab === 'admin-login' && (
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                    Default: Admin@123
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin-login'
                  ? 'bg-blue-950 hover:bg-blue-900'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              <span>
                {activeTab === 'organizer-register' 
                  ? 'Complete Registration & Continue' 
                  : activeTab === 'admin-login' 
                    ? 'Authenticate as Administrator' 
                    : 'Sign In as Organizer'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Workflow Explanation Footer */}
          <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            {activeTab === 'organizer-register' ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('organizer-login')}
                  className="text-blue-900 font-bold hover:underline"
                >
                  Sign In to Organizer Account
                </button>
              </p>
            ) : activeTab === 'organizer-login' ? (
              <p>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('organizer-register')}
                  className="text-blue-900 font-bold hover:underline"
                >
                  Register New Organizer Account
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Official Campus Facilities Admin credentials required.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Admin credentials hint card */}
      <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 block text-[11px]">Administrator Credentials:</span>
          <span className="font-mono text-[10px] text-slate-500">Email: admin@nmamit.in • Password: Admin@123</span>
        </div>
        <button
          type="button"
          onClick={() => handleTabChange('admin-login')}
          className="px-2.5 py-1 rounded-lg bg-blue-900 text-white font-semibold text-[10px] hover:bg-blue-800"
        >
          Use Admin
        </button>
      </div>
    </div>
  )
}
