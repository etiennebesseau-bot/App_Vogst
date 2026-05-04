import { createClient } from '@supabase/supabase-js'
import { TaskCompletion, Expense } from '../types'

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

export async function deleteCompletionsByResident(residentId: string): Promise<void> {
  const { error } = await supabase.from('task_completions').delete().eq('resident_id', residentId)
  if (error) throw error
}

export async function deleteAllCompletions(): Promise<void> {
  const { error } = await supabase.from('task_completions').delete().neq('id', '')
  if (error) throw error
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id:           row.id as string,
    description:  row.description as string,
    amount:       Number(row.amount),
    paidBy:       row.paid_by as string,
    participants: row.participants as string[],
    createdAt:    row.created_at as string,
  }
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapExpense)
}

export async function insertExpense(e: Omit<Expense, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('expenses').insert({
    description:  e.description,
    amount:       e.amount,
    paid_by:      e.paidBy,
    participants: e.participants,
  })
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
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
