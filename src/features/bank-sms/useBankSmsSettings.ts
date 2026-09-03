import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface UserPreferences {
  userId: string
  bankSmsEnabled: boolean
  bankSmsIngestionKey: string | null
}

interface UserPreferencesRow {
  user_id: string
  bank_sms_enabled: boolean
  bank_sms_ingestion_key: string | null
}

/**
 * Loads the authenticated user's user_preferences record.
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: ['user_preferences'],
    queryFn: async (): Promise<UserPreferences | null> => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('user_id, bank_sms_enabled, bank_sms_ingestion_key')
        .maybeSingle()

      if (error) {
        // Handle gracefully if table is not yet created or column is missing
        if (error.code === '42P01' || error.message.includes('relation "user_preferences" does not exist')) {
          return null
        }
        throw new Error(error.message)
      }

      if (!data) return null

      const row = data as UserPreferencesRow
      return {
        userId: row.user_id,
        bankSmsEnabled: Boolean(row.bank_sms_enabled),
        bankSmsIngestionKey: row.bank_sms_ingestion_key ?? null,
      }
    },
  })
}

/**
 * Enables Bank SMS Capture for the authenticated user and returns the ingestion key.
 */
export function useEnableBankSmsCapture() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc('enable_bank_sms_capture')
      if (error) {
        throw new Error(error.message)
      }
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences'] })
    },
  })
}

/**
 * Disables Bank SMS Capture for the authenticated user without deleting the key.
 */
export function useDisableBankSmsCapture() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.rpc('disable_bank_sms_capture')
      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences'] })
    },
  })
}

/**
 * Regenerates the user's Bank SMS ingestion key, invalidating the previous one.
 */
export function useRegenerateBankSmsKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc('regenerate_bank_sms_ingestion_key')
      if (error) {
        throw new Error(error.message)
      }
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_preferences'] })
    },
  })
}
