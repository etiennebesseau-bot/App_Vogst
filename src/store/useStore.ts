import { useState, useCallback } from 'react'
import { TaskCompletion } from '../types'

const STORAGE_KEY = 'vogesenstrasse_v1'

interface StoredData {
  currentResidentId: string | null
  completions: TaskCompletion[]
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { currentResidentId: null, completions: [] }
    return JSON.parse(raw) as StoredData
  } catch {
    return { currentResidentId: null, completions: [] }
  }
}

function persist(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useStore() {
  const [data, setData] = useState<StoredData>(loadData)

  const update = useCallback((updater: (prev: StoredData) => StoredData) => {
    setData(prev => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }, [])

  const selectResident = useCallback(
    (id: string) => update(prev => ({ ...prev, currentResidentId: id })),
    [update],
  )

  const clearResident = useCallback(
    () => update(prev => ({ ...prev, currentResidentId: null })),
    [update],
  )

  const addCompletion = useCallback(
    (completion: TaskCompletion) =>
      update(prev => ({ ...prev, completions: [...prev.completions, completion] })),
    [update],
  )

  return {
    currentResidentId: data.currentResidentId,
    completions: data.completions,
    selectResident,
    clearResident,
    addCompletion,
  }
}
