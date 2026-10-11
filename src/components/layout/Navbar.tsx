import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { formatDateIST, formatTimeIST } from '@/lib/utils'
import { 
  Bell, 
  User, 
  LogOut, 
  Shield, 
  Sparkles, 
  CheckCheck, 
  Database, 
  ChevronDown, 
  Menu,
  School
} from 'lucide-react'
import { Badge } from '../common/Badge'

interface NavbarProps {
  onToggleSidebar?: () => void
  onNavigate?: (tab: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { currentUser, isAdmin, logout, switchRole } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onNavigate?.(isAdmin ? 'admin-overview' : 'overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <School className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight font-heading">
                  Nitte <span className="text-blue-900">CampusConnect</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                  NMAMIT
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 font-medium">
                One Campus. One Calendar. Smarter Events.
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Database status pill + Role Switcher Demo pill + Notifications + User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase Status indicator */}
          <div 
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600"
            title={isSupabaseConfigured ? 'Connected to hosted Supabase PostgreSQL database' : 'Running in Local Storage demo mode with realistic campus data & transactional simulation'}
          >
            <Database className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-[11px]">
              {isSupabaseConfigured ? 'Supabase Live' : 'Demo Mode (Offline/Local)'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
          </div>

          {/* Quick Role Switcher for Evaluation */}
          {currentUser && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => {
                  switchRole('user')
                  onNavigate?.('overview')
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  !isAdmin 
                    ? 'bg-white text-blue-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Student/Faculty Organizer view"
              >
                Organizer
              </button>
              <button
                onClick={() => {
                  switchRole('admin')
                  onNavigate?.('admin-overview')
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  isAdmin 
                    ? 'bg-blue-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Campus Facilities Administrator view"
              >
                <Shield className="w-3 h-3" />
                Admin
              </button>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="warning">{unreadCount} new</Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs text-blue-900 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markRead(notif.id)
                          if (notif.bookingId) {
                            onNavigate?.(isAdmin ? 'admin-requests' : 'my-bookings')
                            setShowNotifications(false)
                          }
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notif.isRead ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {formatDateIST(notif.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50/50">
                  <button
                    onClick={() => {
                      setShowNotifications(false)
                      onNavigate?.('notifications')
                    }}
                    className="text-xs font-medium text-blue-900 hover:underline"
                  >
                    View notification center
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-200">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.fullName.charAt(0)
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-semibold text-slate-900 leading-none">
                    {currentUser.fullName}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5 capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-indigo-700 font-medium mt-1 truncate">{currentUser.department}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        onNavigate?.('profile')
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Profile & Department Settings
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          onNavigate?.('system-settings')
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4 text-slate-500" />
                        System Security & Domain Rules
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        logout()
                        onNavigate?.('login')
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate?.('login')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-900 text-white font-medium text-xs hover:bg-blue-800 transition-colors shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
