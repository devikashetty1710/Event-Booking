import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UserProfile, UserRole } from '@/types'
import { UsersDB } from '@/lib/db'
import { initDB } from '@/lib/storage'
import { INITIAL_USERS } from '@/lib/demoData'

export interface LoginParams {
  email: string
  password?: string
  targetRole?: UserRole
  fullName?: string
  department?: string
  isRegistration?: boolean
  adminPasscode?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: UserProfile
}

interface AuthContextType {
  currentUser: UserProfile | null
  isAuthenticated: boolean
  isAdmin: boolean
  isOrganizer: boolean
  isLoading: boolean
  allowedDomains: string[]
  login: (params: LoginParams) => Promise<AuthResponse>
  logout: () => void
  validateAdminCredentials: (password: string) => boolean
  validateDomain: (email: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ALLOWED_DOMAINS = ['nmamit.in', 'nitte.in']
const ADMIN_MASTER_CREDENTIAL = 'Admin@123'

// We store ONLY the user's ID in localStorage (not the whole object).
// The full profile is fetched from IndexedDB on load.
const AUTH_SESSION_KEY = 'campus_connect_session_user_id_v3'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: initialise the IndexedDB, ensure admin exists, restore session
  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        // 1. Open IndexedDB and seed initial data if first run
        await initDB()

        // 2. Ensure admin account always exists in DB
        const adminExists = await UsersDB.getByEmail('admin@nmamit.in')
        if (!adminExists) {
          await UsersDB.saveAll(INITIAL_USERS)
        }

        // 3. Restore session: look up user by stored ID
        const storedId = localStorage.getItem(AUTH_SESSION_KEY)
        if (storedId) {
          const savedUser = await UsersDB.getById(storedId)
          if (!cancelled && savedUser) {
            setCurrentUser(savedUser)
          }
        }
      } catch (err) {
        console.error('CampusConnect DB init error:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    boot()
    return () => { cancelled = true }
  }, [])

  // Persist session ID to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_SESSION_KEY, currentUser.id)
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY)
    }
  }, [currentUser])

  const validateDomain = useCallback((email: string): boolean => {
    const trimmed = email.trim().toLowerCase()
    return ALLOWED_DOMAINS.some(domain => trimmed.endsWith(`@${domain}`))
  }, [])

  const validateAdminCredentials = useCallback((password: string): boolean => {
    return password === ADMIN_MASTER_CREDENTIAL
  }, [])

  const login = useCallback(async (params: LoginParams): Promise<AuthResponse> => {
    const trimmedEmail = params.email.trim().toLowerCase()
    const password = params.password?.trim() || ''

    if (!trimmedEmail) {
      return { success: false, message: 'Institutional email is required.' }
    }

    if (!validateDomain(trimmedEmail)) {
      return {
        success: false,
        message: `Institutional access restricted to @nmamit.in and @nitte.in domains. "${trimmedEmail.split('@')[1] || 'domain'}" is not authorized.`
      }
    }

    // Look up user in IndexedDB
    let foundUser = await UsersDB.getByEmail(trimmedEmail)

    // ── REGISTRATION MODE ────────────────────────────────────────────────
    if (params.isRegistration) {
      if (foundUser) {
        return {
          success: false,
          message: 'An account with this institutional email already exists. Please log in.'
        }
      }

      if (!password || password.length < 6) {
        return { success: false, message: 'Please create a password of at least 6 characters.' }
      }

      const requestedRole = params.targetRole || 'user'

      // Admin registration requires the master key
      if (requestedRole === 'admin') {
        if (params.adminPasscode !== ADMIN_MASTER_CREDENTIAL) {
          return {
            success: false,
            message: 'Invalid Admin Security Key. Only authorized campus administration officers can register as admin.'
          }
        }
      }

      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        fullName: params.fullName?.trim() || trimmedEmail.split('@')[0].toUpperCase(),
        department: params.department?.trim() || 'Department of Computer Applications',
        role: requestedRole,
        password: password,
        createdAt: new Date().toISOString()
      }

      // Persist to IndexedDB
      await UsersDB.save(newUser)
      setCurrentUser(newUser)
      return { success: true, user: newUser }
    }

    // ── LOGIN MODE ────────────────────────────────────────────────────────
    if (!foundUser) {
      // Special case: official admin account
      if (trimmedEmail === 'admin@nmamit.in') {
        const adminProfile = INITIAL_USERS[0]
        await UsersDB.save(adminProfile)
        foundUser = adminProfile
      } else {
        return {
          success: false,
          message: 'Account not found. Please click "Register" to create your organizer account first.'
        }
      }
    }

    // Credential validation
    if (foundUser.role === 'admin' || params.targetRole === 'admin') {
      const requiredPassword = foundUser.password || ADMIN_MASTER_CREDENTIAL
      if (password !== requiredPassword && password !== ADMIN_MASTER_CREDENTIAL) {
        return {
          success: false,
          message: 'Invalid Administrator Credentials. Please enter the correct administrator password (Admin@123).'
        }
      }
    } else {
      // Organizer validation
      if (foundUser.password && password !== foundUser.password) {
        return {
          success: false,
          message: 'Invalid password. Please enter the credentials created during registration.'
        }
      }
    }

    setCurrentUser(foundUser)
    return { success: true, user: foundUser }
  }, [validateDomain])

  const logout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem(AUTH_SESSION_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isOrganizer: currentUser?.role === 'user',
        isLoading,
        allowedDomains: ALLOWED_DOMAINS,
        login,
        logout,
        validateAdminCredentials,
        validateDomain
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

