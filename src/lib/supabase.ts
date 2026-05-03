import { createClient } from '@supabase/supabase-js'
import { TaskCompletion } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

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
