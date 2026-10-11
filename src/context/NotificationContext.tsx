import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { NotificationItem } from '@/types'
import { fetchNotifications, markNotificationAsRead, markAllNotificationsRead, subscribeToStore } from '@/lib/storage'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: NotificationItem[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const loadNotifs = useCallback(async () => {
    if (!currentUser) {
      setNotifications([])
      return
    }
    const data = await fetchNotifications(currentUser.id)
    setNotifications(data)
  }, [currentUser])

  useEffect(() => {
    loadNotifs()
    const unsubscribe = subscribeToStore(() => {
      loadNotifs()
    })
    return () => unsubscribe()
  }, [loadNotifs])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markRead = async (id: string) => {
    await markNotificationAsRead(id)
    await loadNotifs()
  }

  const markAllRead = async () => {
    if (!currentUser) return
    await markAllNotificationsRead(currentUser.id)
    await loadNotifs()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        refreshNotifications: loadNotifs
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return ctx
}
