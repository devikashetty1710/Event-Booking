import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  LayoutDashboard, 
  Calendar, 
  Building2, 
  PlusCircle, 
  BookMarked, 
  Bell, 
  HelpCircle, 
  UserCircle,
  ShieldAlert,
  Sliders,
  Users,
  BarChart3,
  Layers,
  Sparkles,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
  badge?: number | string
}

interface SidebarProps {
  currentTab: string
  onSelectTab: (tab: string) => void
  isOpenMobile: boolean
  onCloseMobile: () => void
  pendingRequestsCount?: number
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingRequestsCount = 0
}) => {
  const { isAdmin } = useAuth()

  // User navigation items
  const userNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'calendar', label: 'Campus Calendar', icon: Calendar },
    { id: 'venues', label: 'Find a Venue', icon: Building2 },
    { id: 'book-venue', label: 'Book a Venue', icon: PlusCircle, highlight: true },
    { id: 'my-bookings', label: 'My Bookings', icon: BookMarked },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'guidelines', label: 'Help & Guidelines', icon: HelpCircle },
    { id: 'profile', label: 'Profile & Settings', icon: UserCircle }
  ]

  // Administrator navigation items
  const adminNavItems: NavItem[] = [
    { id: 'admin-overview', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'admin-calendar', label: 'Master Calendar', icon: Calendar },
    { 
      id: 'admin-requests', 
      label: 'Booking Requests', 
      icon: Layers, 
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined 
    },
    { id: 'admin-venues', label: 'Venue Management', icon: Building2 },
    { id: 'admin-conflicts', label: 'Conflict Monitor', icon: ShieldAlert },
    { id: 'admin-reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'admin-users', label: 'User & Role Access', icon: Users },
    { id: 'system-settings', label: 'System Settings', icon: Sliders }
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 lg:top-16 z-40 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col justify-between',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="font-bold text-sm text-slate-800">CampusConnect Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Indicator */}
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-600 flex items-center justify-between">
            <span>{isAdmin ? 'Administration Portal' : 'Organizer Portal'}</span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-900 font-bold">
                Admin
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id)
                    onCloseMobile()
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    item.highlight && !isActive && 'bg-blue-50/70 text-blue-900 hover:bg-blue-100/70 border border-blue-200/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : item.highlight ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700')} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold',
                      isActive ? 'bg-white text-blue-900' : 'bg-amber-100 text-amber-900'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Institutional Info Box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs">
            <div className="flex items-center gap-2 text-indigo-700 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Booking Tips</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Auditorium bookings require min. 48-hour administrative lead time for AV coordination.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
