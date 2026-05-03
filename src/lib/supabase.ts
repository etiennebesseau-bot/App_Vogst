import { createClient } from '@supabase/supabase-js'
import { TaskCompletion } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

// ─── Task completions ─────────────────────────────────────────────────────────

export async function fetchCompletions(): Promise<TaskCompletion[]> {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .order('completed_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    id:           row.id,
    taskId:       row.task_id,
    residentId:   row.resident_id,
    completedAt:  row.completed_at,
    pointsEarned: row.points_earned,
  }))
}

export async function insertCompletion(c: TaskCompletion): Promise<void> {
  const { error } = await supabase.from('task_completions').insert({
    id:            c.id,
    task_id:       c.taskId,
    resident_id:   c.residentId,
    completed_at:  c.completedAt,
    points_earned: c.pointsEarned,
  })
  if (error) throw error
}

export async function deleteCompletion(id: string): Promise<void> {
  const { error } = await supabase.from('task_completions').delete().eq('id', id)
  if (error) throw error
}

// ─── Push subscriptions ───────────────────────────────────────────────────────

export async function savePushSubscription(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      p256dh:   json.keys?.p256dh ?? '',
      auth:     json.keys?.auth ?? '',
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}
