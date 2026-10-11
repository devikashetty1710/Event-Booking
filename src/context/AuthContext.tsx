import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserProfile, UserRole } from '@/types'
import { localStore } from '@/lib/storage'
import { INITIAL_USERS } from '@/lib/demoData'

interface AuthContextType {
  currentUser: UserProfile | null
  isAuthenticated: boolean
  isAdmin: boolean
  allowedDomains: string[]
  login: (email: string, fullName?: string, department?: string) => { success: boolean; message?: string }
  loginAsDemoUser: (userId: string) => void
  logout: () => void
  switchRole: (role: UserRole) => void
  validateDomain: (email: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ALLOWED_DOMAINS = ['nmamit.in', 'nitte.in']

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('nitte_campusconnect_auth_user')
      if (stored) return JSON.parse(stored)
      // Default to faculty organizer for instant evaluation
      return INITIAL_USERS[1] // Prof. Smitha Rao
    } catch {
      return INITIAL_USERS[1]
    }
  })

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nitte_campusconnect_auth_user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('nitte_campusconnect_auth_user')
    }
  }, [currentUser])

  const validateDomain = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase()
    return ALLOWED_DOMAINS.some(domain => trimmed.endsWith(`@${domain}`))
  }

  const login = (email: string, fullName: string = 'Campus Member', department: string = 'Engineering'): { success: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase()
    
    // Check domain validation
    if (!validateDomain(trimmedEmail)) {
      return {
        success: false,
        message: `Institutional access restricted to @nmamit.in and @nitte.in domains. "${trimmedEmail.split('@')[1] || 'provided domain'}" is not authorized.`
      }
    }

    // Check if user exists in registered users
    const allUsers = localStore.getUsers()
    let foundUser = allUsers.find(u => u.email.toLowerCase() === trimmedEmail)

    if (!foundUser) {
      // Determine default role: admin if dean or specific admin keyword, else user
      const isDeanOrAdmin = trimmedEmail.includes('admin') || trimmedEmail.includes('dean')
      foundUser = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        fullName: fullName || trimmedEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        department: department || 'NMAMIT Campus Faculty & Students',
        role: isDeanOrAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      }
      allUsers.push(foundUser)
      localStore.saveUsers(allUsers)
    }

    setCurrentUser(foundUser)
    return { success: true }
  }

  const loginAsDemoUser = (userId: string) => {
    const allUsers = localStore.getUsers()
    const found = allUsers.find(u => u.id === userId) || INITIAL_USERS.find(u => u.id === userId)
    if (found) {
      setCurrentUser(found)
    }
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const switchRole = (newRole: UserRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role: newRole }
      setCurrentUser(updated)
      const allUsers = localStore.getUsers()
      const idx = allUsers.findIndex(u => u.id === currentUser.id)
      if (idx >= 0) {
        allUsers[idx] = updated
        localStore.saveUsers(allUsers)
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        allowedDomains: ALLOWED_DOMAINS,
        login,
        loginAsDemoUser,
        logout,
        switchRole,
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
