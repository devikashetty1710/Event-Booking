import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserProfile, UserRole } from '@/types'
import { localStore } from '@/lib/storage'
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
  allowedDomains: string[]
  login: (params: LoginParams) => AuthResponse
  logout: () => void
  validateAdminCredentials: (password: string) => boolean
  validateDomain: (email: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ALLOWED_DOMAINS = ['nmamit.in', 'nitte.in']
const ADMIN_MASTER_CREDENTIAL = 'Admin@123'
const AUTH_STORAGE_KEY = 'nitte_campusconnect_auth_user_v2'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fresh starts require explicit login/registration
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) return JSON.parse(stored)
      return null
    } catch {
      return null
    }
  })

  // Ensure initial admin user exists in localStore
  useEffect(() => {
    const existingUsers = localStore.getUsers()
    const adminExists = existingUsers.some(u => u.email.toLowerCase() === 'admin@nmamit.in')
    if (!adminExists) {
      localStore.saveUsers([...existingUsers, INITIAL_USERS[0]])
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [currentUser])

  const validateDomain = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase()
    return ALLOWED_DOMAINS.some(domain => trimmed.endsWith(`@${domain}`))
  }

  const validateAdminCredentials = (password: string): boolean => {
    return password === ADMIN_MASTER_CREDENTIAL
  }

  const login = (params: LoginParams): AuthResponse => {
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

    const allUsers = localStore.getUsers()
    let foundUser = allUsers.find(u => u.email.toLowerCase() === trimmedEmail)

    // Registration Mode (Organizer must register first)
    if (params.isRegistration) {
      if (foundUser) {
        return { success: false, message: 'An account with this institutional email already exists. Please log in.' }
      }

      if (!password || password.length < 6) {
        return { success: false, message: 'Please create a password of at least 6 characters.' }
      }

      const requestedRole = params.targetRole || 'user'
      // If someone tries to register as Admin, verify the admin master key
      if (requestedRole === 'admin') {
        if (params.adminPasscode !== ADMIN_MASTER_CREDENTIAL) {
          return { success: false, message: 'Invalid Admin Security Key. Only authorized campus administration officers can register as admin.' }
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

      allUsers.push(newUser)
      localStore.saveUsers(allUsers)
      setCurrentUser(newUser)
      return { success: true, user: newUser }
    }

    // Login Mode
    if (!foundUser) {
      // Check if it's the official administrator account
      if (trimmedEmail === 'admin@nmamit.in') {
        foundUser = INITIAL_USERS[0]
        allUsers.push(INITIAL_USERS[0])
        localStore.saveUsers(allUsers)
      } else {
        return {
          success: false,
          message: 'Account not found. Please click "Register" above to create your organizer account first.'
        }
      }
    }

    // Role-specific credential validation
    if (foundUser.role === 'admin' || params.targetRole === 'admin') {
      const requiredPassword = foundUser.password || ADMIN_MASTER_CREDENTIAL
      if (password !== requiredPassword && password !== ADMIN_MASTER_CREDENTIAL) {
        return {
          success: false,
          message: 'Invalid Administrator Credentials. Please enter the correct administrator password (Admin@123).'
        }
      }
    } else {
      // Organizer credentials validation
      if (foundUser.password && password !== foundUser.password) {
        return {
          success: false,
          message: 'Invalid password. Please enter the credentials created during registration.'
        }
      }
    }

    setCurrentUser(foundUser)
    return { success: true, user: foundUser }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isOrganizer: currentUser?.role === 'user',
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
