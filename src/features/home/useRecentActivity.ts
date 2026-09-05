import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { formatActivityEvent } from '../activity/activityFormatter'
import type { ActivityEventRow, RecentActivityEntry } from '../activity/activityTypes'

export type { RecentActivityEntry } from '../activity/activityTypes'

export const RECENT_ACTIVITY_PREVIEW_COUNT = 6
export const RECENT_ACTIVITY_FETCH_LIMIT = 50

/**
 * Fetches persisted domain events from `activity_events` ordered chronologically.
 *
 * Resolves the actor name via `app_users -> people` and formats every event
 * into a natural household sentence using `formatActivityEvent`.
 *
 * Degrades gracefully to an empty feed if the backend table has not been migrated yet.
 */
export function useRecentActivity(limit = RECENT_ACTIVITY_FETCH_LIMIT) {
  return useQuery({
    queryKey: ['home', 'recent-activity', limit],
    queryFn: async (): Promise<RecentActivityEntry[]> => {
      // 1. Fetch user mapping as fallback in case direct PostgREST join is not configured
      let actorMap: Record<string, string> = {}
      try {
        const { data: users } = await supabase
          .from('app_users')
          .select('user_id, person:people(name)')

        if (users) {
          for (const u of users) {
            const person = u.person as unknown as { name?: string | null } | null
            if (u.user_id && person?.name) {
              actorMap[u.user_id] = person.name
            }
          }
        }
      } catch {
        // Non-critical if app_users query fails
      }

      // 2. Fetch persisted activity events
      const { data, error } = await supabase
        .from('activity_events')
        .select(`
          id,
          event_type,
          actor_user_id,
          entity_type,
          entity_id,
          related_entity_type,
          related_entity_id,
          metadata,
          correlation_id,
          source_operation,
          occurred_at,
          actor:app_users(
            person:people(name)
          )
        `)
        .order('occurred_at', { ascending: false })
        .limit(limit)

      if (error) {
        // If table doesn't exist yet in an unmigrated database, degrade gracefully to empty list
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return []
        }
        // If join fails due to relationship naming, fallback to query without join
        if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
          const fallbackRes = await supabase
            .from('activity_events')
            .select(`
              id,
              event_type,
              actor_user_id,
              entity_type,
              entity_id,
              related_entity_type,
              related_entity_id,
              metadata,
              correlation_id,
              source_operation,
              occurred_at
            `)
            .order('occurred_at', { ascending: false })
            .limit(limit)

          if (fallbackRes.error) {
            if (fallbackRes.error.code === '42P01' || fallbackRes.error.message?.includes('does not exist')) {
              return []
            }
            throw fallbackRes.error
          }

          return (fallbackRes.data as unknown as ActivityEventRow[]).map((row) =>
            formatActivityEvent(row, actorMap),
          )
        }

        throw error
      }

      return (data as unknown as ActivityEventRow[]).map((row) =>
        formatActivityEvent(row, actorMap),
      )
    },
  })
}
