'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearExplicitSignOut, markExplicitSignOut } from '@/lib/auth/devSession'

interface AuthState {
  token: string | null
  refreshToken: string | null
  userId: string | null
  isAuthenticated: boolean
  /** True after localStorage rehydration — not persisted. */
  hasHydrated: boolean
  setSession: (token: string, userId: string) => void
  setTokens: (accessToken: string, refreshToken: string, userId: string) => void
  updateAccessToken: (accessToken: string, refreshToken: string) => void
  clearSession: () => void
  setHasHydrated: (value: boolean) => void
}

/**
 * Global auth state — persisted to localStorage for session continuity.
 * Only tokens and user ID are stored — never phone numbers or PII.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      hasHydrated: false,

      setSession: (token: string, userId: string) => {
        clearExplicitSignOut()
        set({ token, userId, isAuthenticated: true })
      },

      setTokens: (accessToken: string, refreshToken: string, userId: string) => {
        clearExplicitSignOut()
        set({
          token: accessToken,
          refreshToken,
          userId,
          isAuthenticated: true,
        })
      },

      updateAccessToken: (accessToken: string, refreshToken: string) => {
        set({ token: accessToken, refreshToken })
      },

      clearSession: () => {
        markExplicitSignOut()
        set({
          token: null,
          refreshToken: null,
          userId: null,
          isAuthenticated: false,
        })
      },

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: 'parksafe-auth',
      partialize: state => ({
        token: state.token,
        refreshToken: state.refreshToken,
        userId: state.userId,
      }),
      onRehydrateStorage: () => () => {
        const { token } = useAuthStore.getState()
        useAuthStore.setState({
          hasHydrated: true,
          isAuthenticated: Boolean(token),
        })
      },
    }
  )
)
