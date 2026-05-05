import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react'
import { Apartment, Resident, Task, Category, TaskCompletion, Kudos, LevelInfo } from '../types'
import { APARTMENTS, RESIDENTS, TASKS, CATEGORIES, getLevelInfo } from '../data/initial'
import { supabase, fetchCompletions, insertCompletion, deleteCompletion, fetchKudos, insertKudo } from '../lib/supabase'

export interface ResidentStats {
  totalPoints: number
  monthlyPoints: number
  streak: number
  levelInfo: LevelInfo
  completionsCount: number
}

interface AppContextType {
  apartments: Apartment[]
  residents: Resident[]
  tasks: Task[]
  categories: Category[]
  completions: TaskCompletion[]
  kudos: Kudos[]
  loading: boolean
  currentResidentId: string | null
  currentResident: Resident | null
  currentApartment: Apartment | null
  selectResident: (id: string) => void
  clearResident: () => void
  completeTask: (task: Task) => Promise<void>
  undoCompletion: (completionId: string) => Promise<void>
  isTaskAvailable: (task: Task) => boolean
  getResidentStats: (residentId: string) => ResidentStats
  getLastCompletion: (taskId: string) => TaskCompletion | null
  getMyLastCompletion: (taskId: string) => TaskCompletion | null
  giveKudo: (toResidentId: string) => Promise<void>
  hasGivenKudoToday: (toResidentId: string) => boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)
const RESIDENT_KEY = 'vogesenstrasse_resident'

const ADVANCE_MS = 2 * 24 * 60 * 60 * 1000
const GRACE_MS   = 24 * 60 * 60 * 1000

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [kudos, setKudos] = useState<Kudos[]>([])
  const [loading, setLoading] = useState(true)
  const [currentResidentId, setCurrentResidentId] = useState<string | null>(
    () => localStorage.getItem(RESIDENT_KEY),
  )

  useEffect(() => {
    Promise.all([fetchCompletions(), fetchKudos()])
      .then(([c, k]) => { setCompletions(c); setKudos(k) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('task_completions')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_completions' },
        payload => {
          const row = payload.new as Record<string, unknown>
          const c: TaskCompletion = {
            id:           row.id as string,
            taskId:       row.task_id as string,
            residentId:   row.resident_id as string,
            completedAt:  row.completed_at as string,
            pointsEarned: row.points_earned as number,
          }
          setCompletions(prev => prev.some(x => x.id === c.id) ? prev : [c, ...prev])
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'task_completions' },
        payload => {
          const id = (payload.old as Record<string, unknown>).id as string
          setCompletions(prev => prev.filter(c => c.id !== id))
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const ch = supabase.channel('kudos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kudos' }, p => {
        const row = p.new as Record<string, unknown>
        const k: Kudos = { id: row.id as string, fromResidentId: row.from_resident_id as string, toResidentId: row.to_resident_id as string, createdAt: row.created_at as string }
        setKudos(prev => prev.some(x => x.id === k.id) ? prev : [k, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const selectResident = useCallback((id: string) => {
    localStorage.setItem(RESIDENT_KEY, id)
    setCurrentResidentId(id)
  }, [])

  const clearResident = useCallback(() => {
    localStorage.removeItem(RESIDENT_KEY)
    setCurrentResidentId(null)
  }, [])

  const currentResident = useMemo(
    () => currentResidentId ? (RESIDENTS.find(r => r.id === currentResidentId) ?? null) : null,
    [currentResidentId],
  )

  const currentApartment = useMemo(
    () => currentResident ? (APARTMENTS.find(a => a.id === currentResident.apartmentId) ?? null) : null,
    [currentResident],
  )

  const getLastCompletion = useCallback(
    (taskId: string): TaskCompletion | null =>
      completions
        .filter(c => c.taskId === taskId)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ?? null,
    [completions],
  )

  const getMyLastCompletion = useCallback(
    (taskId: string): TaskCompletion | null =>
      completions
        .filter(c => c.taskId === taskId && c.residentId === currentResidentId)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ?? null,
    [completions, currentResidentId],
  )

  const isTaskAvailable = useCallback(
    (task: Task): boolean => {
      const now = Date.now()

      if (task.scheduledDates && task.scheduledDates.length > 0) {
        const activeDate = task.scheduledDates.find(dateStr => {
          const d = new Date(dateStr).getTime()
          return now >= d - ADVANCE_MS && now <= d + GRACE_MS
        })
        if (!activeDate) return false
        const windowStart = new Date(activeDate).getTime() - ADVANCE_MS
        return !completions.some(
          c => c.taskId === task.id && new Date(c.completedAt).getTime() >= windowStart,
        )
      }

      if (task.perResident && currentResidentId) {
        const last = completions
          .filter(c => c.taskId === task.id && c.residentId === currentResidentId)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
        if (!last) return true
        return (now - new Date(last.completedAt).getTime()) / 86400000 >= (task.recurrenceDays ?? 7)
      }

      const last = completions
        .filter(c => c.taskId === task.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
      if (!last) return true
      return (now - new Date(last.completedAt).getTime()) / 86400000 >= (task.recurrenceDays ?? 7)
    },
    [completions, currentResidentId],
  )

  const getResidentStats = useCallback(
    (residentId: string): ResidentStats => {
      const mine = completions.filter(c => c.residentId === residentId)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const kudosReceived = kudos.filter(k => k.toResidentId === residentId).length
      const monthlyKudos  = kudos.filter(k => k.toResidentId === residentId && new Date(k.createdAt) >= monthStart).length

      const totalPoints   = mine.reduce((s, c) => s + c.pointsEarned, 0) + kudosReceived
      const monthlyPoints = mine.filter(c => new Date(c.completedAt) >= monthStart).reduce((s, c) => s + c.pointsEarned, 0) + monthlyKudos

      const days = [...new Set(mine.map(c => new Date(c.completedAt).toDateString()))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      let streak = 0
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      if (days.length > 0 && (days[0] === today || days[0] === yesterday)) {
        streak = 1
        for (let i = 1; i < days.length; i++) {
          const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000
          if (diff <= 1.5) streak++
          else break
        }
      }

      return { totalPoints, monthlyPoints, streak, levelInfo: getLevelInfo(totalPoints), completionsCount: mine.length }
    },
    [completions, kudos],
  )

  const hasGivenKudoToday = useCallback(
    (toResidentId: string): boolean => {
      const today = new Date().toDateString()
      return kudos.some(k => k.fromResidentId === currentResidentId && k.toResidentId === toResidentId && new Date(k.createdAt).toDateString() === today)
    },
    [kudos, currentResidentId],
  )

  const giveKudo = useCallback(
    async (toResidentId: string) => {
      if (!currentResidentId) return
      const k: Kudos = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, fromResidentId: currentResidentId, toResidentId, createdAt: new Date().toISOString() }
      setKudos(prev => [k, ...prev])
      try {
        await insertKudo(currentResidentId, toResidentId)
      } catch (err) {
        setKudos(prev => prev.filter(x => x.id !== k.id))
        console.error('Supabase Fehler:', err)
      }
    },
    [currentResidentId],
  )

  const refresh = useCallback(async () => {
    const [c, k] = await Promise.all([fetchCompletions(), fetchKudos()])
    setCompletions(c)
    setKudos(k)
  }, [])

  const completeTask = useCallback(
    async (task: Task) => {
      if (!currentResidentId) return
      const completion: TaskCompletion = {
        id:           `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        taskId:       task.id,
        residentId:   currentResidentId,
        completedAt:  new Date().toISOString(),
        pointsEarned: task.points,
      }
      setCompletions(prev => [completion, ...prev])
      try {
        await insertCompletion(completion)
      } catch (err) {
        setCompletions(prev => prev.filter(c => c.id !== completion.id))
        console.error('Supabase Fehler:', err)
      }
    },
    [currentResidentId],
  )

  const undoCompletion = useCallback(
    async (completionId: string) => {
      const completion = completions.find(c => c.id === completionId)
      if (!completion) return
      setCompletions(prev => prev.filter(c => c.id !== completionId))
      try {
        await deleteCompletion(completionId)
      } catch (err) {
        setCompletions(prev => [completion, ...prev])
        console.error('Supabase Fehler:', err)
      }
    },
    [completions],
  )

  return (
    <AppContext.Provider value={{
      apartments: APARTMENTS, residents: RESIDENTS, tasks: TASKS, categories: CATEGORIES,
      completions, kudos, loading, currentResidentId, currentResident, currentApartment,
      selectResident, clearResident, completeTask, undoCompletion,
      isTaskAvailable, getResidentStats, getLastCompletion, getMyLastCompletion,
      giveKudo, hasGivenKudoToday, refresh,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
