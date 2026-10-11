import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { Footer } from './components/layout/Footer'
import { fetchVenues, fetchBookings, fetchMaintenanceBlocks, subscribeToStore } from './lib/storage'
import { Venue, Booking, VenueMaintenanceBlock } from './types'

// Pages
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/public/LoginPage'
import { UserDashboard } from './pages/user/UserDashboard'
import { CampusCalendarPage } from './pages/user/CampusCalendarPage'
import { VenueDirectoryPage } from './pages/user/VenueDirectoryPage'
import { MyBookingsPage } from './pages/user/MyBookingsPage'
import { HelpGuidelinesPage } from './pages/user/HelpGuidelinesPage'
import { ProfileSettingsPage } from './pages/user/ProfileSettingsPage'
import { NotificationCenterPage } from './pages/user/NotificationCenterPage'
import { BookingWizard } from './components/booking/BookingWizard'

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { BookingReviewQueue } from './pages/admin/BookingReviewQueue'
import { MasterCalendarPage } from './pages/admin/MasterCalendarPage'
import { VenueManagementPage } from './pages/admin/VenueManagementPage'
import { ConflictMonitorPage } from './pages/admin/ConflictMonitorPage'
import { ReportsAnalyticsPage } from './pages/admin/ReportsAnalyticsPage'
import { UserRoleManagementPage } from './pages/admin/UserRoleManagementPage'
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage'

const MainApp: React.FC = () => {
  const { currentUser, isAdmin, isAuthenticated } = useAuth()

  // App Routing State
  const [currentTab, setCurrentTab] = useState<string>('overview')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)

  // Booking Wizard Prefill parameters
  const [wizardParams, setWizardParams] = useState<{
    venueId?: string
    date?: string
    time?: string
  }>({})

  // Core Data
  const [venues, setVenues] = useState<Venue[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<VenueMaintenanceBlock[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch data & subscribe to real-time store changes
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [vData, bData, mData] = await Promise.all([
          fetchVenues(),
          fetchBookings(),
          fetchMaintenanceBlocks()
        ])
        setVenues(vData)
        setBookings(bData)
        setMaintenanceBlocks(mData)
      } catch (err) {
        console.error('Failed to load campus data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()

    // Subscribe to store updates
    const unsubscribe = subscribeToStore(() => {
      loadAllData()
    })

    return () => unsubscribe()
  }, [])

  // Auto-redirect if role changes
  useEffect(() => {
    if (isAdmin && (currentTab === 'overview' || currentTab === 'book-venue' || currentTab === 'my-bookings')) {
      setCurrentTab('admin-overview')
    } else if (!isAdmin && (currentTab.startsWith('admin-') || currentTab === 'system-settings')) {
      setCurrentTab('overview')
    }
  }, [isAdmin])

  const pendingRequestsCount = bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Under Review').length

  const handleStartBooking = (venueId?: string, date?: string, time?: string) => {
    setWizardParams({ venueId, date, time })
    setCurrentTab('book-venue')
  }

  const handleReviseBooking = (booking: Booking) => {
    setWizardParams({
      venueId: booking.requestedVenueId,
      date: booking.requestedDate,
      time: booking.requestedStart
    })
    setCurrentTab('book-venue')
  }

  // Handle Landing and Login pages
  if (currentTab === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar
          onToggleSidebar={() => {}}
          onNavigate={(tab) => setCurrentTab(tab)}
        />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <LandingPage
            venues={venues}
            onGetStarted={() => setCurrentTab(currentUser ? (isAdmin ? 'admin-overview' : 'overview') : 'login')}
            onExploreVenues={() => setCurrentTab('venues')}
            onViewCalendar={() => setCurrentTab('calendar')}
          />
        </main>
        <Footer />
      </div>
    )
  }

  if (currentTab === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar
          onToggleSidebar={() => {}}
          onNavigate={(tab) => setCurrentTab(tab)}
        />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-center p-4">
          <LoginPage
            onLoginSuccess={(role) => setCurrentTab(role === 'admin' ? 'admin-overview' : 'overview')}
          />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          pendingRequestsCount={pendingRequestsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {isLoading ? (
            <div className="py-24 text-center text-xs text-slate-500">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading NMAMIT campus data & calendar...
            </div>
          ) : (
            <>
              {/* User Tab Views */}
              {currentTab === 'overview' && (
                <UserDashboard
                  bookings={bookings}
                  venues={venues}
                  onNavigate={(tab, params) => {
                    if (params?.venueId) setWizardParams({ venueId: params.venueId })
                    setCurrentTab(tab)
                  }}
                />
              )}

              {currentTab === 'calendar' && (
                <CampusCalendarPage
                  bookings={bookings}
                  venues={venues}
                  onQuickBookSlot={(date, time) => handleStartBooking(undefined, date, time)}
                />
              )}

              {currentTab === 'venues' && (
                <VenueDirectoryPage
                  venues={venues}
                  bookings={bookings}
                  onBookVenue={(vId) => handleStartBooking(vId)}
                />
              )}

              {currentTab === 'book-venue' && (
                <BookingWizard
                  venues={venues}
                  allBookings={bookings}
                  initialVenueId={wizardParams.venueId}
                  initialDate={wizardParams.date}
                  initialTime={wizardParams.time}
                  onComplete={() => setCurrentTab('my-bookings')}
                  onCancel={() => setCurrentTab('overview')}
                />
              )}

              {currentTab === 'my-bookings' && (
                <MyBookingsPage
                  bookings={bookings}
                  venues={venues}
                  onReviseBooking={handleReviseBooking}
                />
              )}

              {currentTab === 'guidelines' && <HelpGuidelinesPage />}

              {currentTab === 'profile' && <ProfileSettingsPage />}

              {currentTab === 'notifications' && (
                <NotificationCenterPage
                  onNavigateBooking={() => setCurrentTab(isAdmin ? 'admin-requests' : 'my-bookings')}
                />
              )}

              {/* Admin Tab Views */}
              {currentTab === 'admin-overview' && (
                <AdminDashboard
                  bookings={bookings}
                  venues={venues}
                  maintenanceBlocks={maintenanceBlocks}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'admin-requests' && (
                <BookingReviewQueue
                  bookings={bookings}
                  venues={venues}
                />
              )}

              {currentTab === 'admin-calendar' && (
                <MasterCalendarPage
                  bookings={bookings}
                  venues={venues}
                />
              )}

              {currentTab === 'admin-venues' && (
                <VenueManagementPage
                  venues={venues}
                  bookings={bookings}
                  maintenanceBlocks={maintenanceBlocks}
                />
              )}

              {currentTab === 'admin-conflicts' && (
                <ConflictMonitorPage
                  bookings={bookings}
                  venues={venues}
                  maintenanceBlocks={maintenanceBlocks}
                  onOpenReviewQueue={() => setCurrentTab('admin-requests')}
                />
              )}

              {currentTab === 'admin-reports' && (
                <ReportsAnalyticsPage
                  bookings={bookings}
                  venues={venues}
                />
              )}

              {currentTab === 'admin-users' && <UserRoleManagementPage />}

              {currentTab === 'system-settings' && <SystemSettingsPage />}
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
