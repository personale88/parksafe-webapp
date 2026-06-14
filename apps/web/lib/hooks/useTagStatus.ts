'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTagPreferences } from '@/lib/api/tags'
import { useAuthStore } from '@/lib/store/authStore'

interface TagPreferences {
  notifyWhatsapp?: boolean
  callEnabled?: boolean
}

/**
 * Manages tag notification preference updates for the owner dashboard.
 * Optimistically updates the cache then invalidates on settlement.
 */
export function useTagStatus(tagId: string) {
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (prefs: TagPreferences) =>
      updateTagPreferences(tagId, prefs, token ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tags', tagId] })
    },
  })

  return {
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    error: updateMutation.error,
  }
}
