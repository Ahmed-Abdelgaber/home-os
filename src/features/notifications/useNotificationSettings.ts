import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../core/auth/useAuth'
import { supabase } from '../../core/supabase/client'

export type NotificationSettings = {
  user_id: string
  spend_warning_enabled: boolean
  monthly_spend_limit: number | null
  trip_start_enabled: boolean
  trip_end_enabled: boolean
  long_stocked_enabled: boolean
  long_stocked_days: number
}

export function useNotificationSettings() {
  const { session } = useAuth()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: async (): Promise<NotificationSettings | null> => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useUpdateNotificationSettings() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user.id

  return useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      if (!userId) throw new Error('Not logged in')
      
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      const payload = {
        user_id: userId,
        spend_warning_enabled: existing?.spend_warning_enabled ?? false,
        monthly_spend_limit: existing?.monthly_spend_limit ?? null,
        trip_start_enabled: existing?.trip_start_enabled ?? false,
        trip_end_enabled: existing?.trip_end_enabled ?? false,
        long_stocked_enabled: existing?.long_stocked_enabled ?? false,
        long_stocked_days: existing?.long_stocked_days ?? 30,
        ...updates
      }

      const { error } = await supabase.from('notification_settings').upsert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', userId] })
    },
  })
}
