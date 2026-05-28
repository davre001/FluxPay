import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferences {
  theme?: 'light' | 'dark'
  notificationsEnabled?: boolean
  emailNotifications?: boolean
  itemsPerPage?: number
}

interface UserStore {
  userId: string | null
  preferences: UserPreferences
  isAuthenticated: boolean
  setUser: (userId: string) => void
  logout: () => void
  updatePreferences: (prefs: Partial<UserPreferences>) => void
  setTheme: (theme: 'light' | 'dark') => void
  setNotifications: (enabled: boolean) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userId: null,
      preferences: {
        theme: 'light',
        notificationsEnabled: true,
        emailNotifications: true,
        itemsPerPage: 10,
      },
      isAuthenticated: false,

      setUser: (userId) =>
        set({
          userId,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          userId: null,
          isAuthenticated: false,
        }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),

      setNotifications: (enabled) =>
        set((state) => ({
          preferences: { ...state.preferences, notificationsEnabled: enabled },
        })),
    }),
    {
      name: 'user-store',
    }
  )
)
