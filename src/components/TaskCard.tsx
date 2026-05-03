import { useState } from 'react'
import { Task, TaskCompletion } from '../types'
import { CATEGORIES, getNextScheduledDate } from '../data/initial'

interface Props {
  task: Task
  completed?: boolean
  lastCompletion?: TaskCompletion | null
  onComplete?: () => void
  onUndo?: () => void
}

export default function TaskCard({ task, completed = false, lastCompletion, onComplete, onUndo }: Props) {
  const [animating, setAnimating] = useState(false)
  const category = CATEGORIES.find(c => c.id === task.categoryId)
  const nextDate = getNextScheduledDate(task)

  function handleComplete() {
    if (completed || !onComplete || animating) return
    setAnimating(true)
    onComplete()
    setTimeout(() => setAnimating(false), 900)
  }

  return (
    <div className={`relative bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm transition-opacity ${completed ? 'opacity-60' : ''}`}>
      {animating && (
        <span className="points-pop absolute -top-3 right-14 text-violet-600 font-bold text-sm pointer-events-none z-10">
          +{task.points} Pkt ✨
        </span>
      )}

      <div className="text-2xl flex-shrink-0">{category?.icon ?? '📋'}</div>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-gray-900 leading-tight ${completed ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </p>
        {task.description && !completed && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}
        {nextDate && !completed && (
          <p className="text-xs font-medium mt-0.5 text-red-500">
            📅 {nextDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        )}
        {completed && lastCompletion && (
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(lastCompletion.completedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">
          +{task.points}
        </span>
        {!completed ? (
          <button
            onClick={handleComplete}
            className="w-9 h-9 rounded-xl bg-violet-600 text-white font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
          >
            ✓
          </button>
        ) : (
          onUndo && (
            <button
              onClick={onUndo}
              title="Rückgängig machen"
              className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 font-bold text-base flex items-center justify-center active:scale-90 transition-transform hover:bg-red-50 hover:text-red-400"
            >
              ↩
            </button>
          )
        )}
      </div>
    </div>
  )
}
