import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface TripInput {
  name: string
  departureDate: string
  returnDate: string
  personId: string
  notes: string | null
}

function toRow(input: TripInput) {
  return {
    name: input.name,
    departure_date: input.departureDate,
    return_date: input.returnDate,
    person_id: input.personId,
    notes: input.notes,
  }
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TripInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from('trips').insert(toRow(input)).select('id').single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TripInput }) => {
      const { error } = await supabase.from('trips').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
