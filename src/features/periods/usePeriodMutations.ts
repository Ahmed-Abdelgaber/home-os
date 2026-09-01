import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { cairoToday } from '../../core/utils/cairoDate'

export function useStartPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      // First ensure there's no active period
      const { data: active } = await supabase.from('periods').select('id').eq('is_active', true).maybeSingle()
      if (active) throw new Error('A period is already active. End it first.')

      const { error } = await supabase.from('periods').insert({
        start_date: cairoToday(),
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['periods'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}

export function useEndPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('periods')
        .update({
          is_active: false,
          end_date: cairoToday(),
        })
        .eq('id', id)
        .eq('is_active', true)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['periods'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}

export function useCyclePeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (currentActiveId: string | null) => {
      if (currentActiveId) {
        const { error: endError } = await supabase
          .from('periods')
          .update({
            is_active: false,
            end_date: cairoToday(),
          })
          .eq('id', currentActiveId)
        if (endError) throw endError
      }

      const { error: startError } = await supabase.from('periods').insert({
        start_date: cairoToday(),
        is_active: true,
      })
      if (startError) throw startError
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['periods'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}
