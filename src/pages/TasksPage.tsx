import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Task, TaskCompletion } from '../types'
import TaskCard from '../components/TaskCard'

// ─── Urgency for Vorschlag ────────────────────────────────────────────────────

function getUrgency(task: Task, completions: TaskCompletion[], currentResidentId: string | null) {
  if (task.scheduledDates) {
    const now  = Date.now()
    const next = task.scheduledDates
      .map(d => new Date(d).getTime())
      .filter(t => t > now - 86400000)
      .sort((a, b) => a - b)[0]
    if (!next) return { score: -1, label: 'Kein Termin', color: 'gray' }
    const days = (next - now) / 86400000
    if (days <= 0)  return { score: 10, label: 'Heute!',                        color: 'red'    }
    if (days <= 2)  return { score: 5,  label: `In ${Math.ceil(days)} Tag(en)`, color: 'orange' }
    return           { score: 0.1, label: `In ${Math.ceil(days)} Tagen`,        color: 'gray'   }
  }

  const mine = task.perResident
    ? completions.filter(c => c.taskId === task.id && c.residentId === currentResidentId)
    : completions.filter(c => c.taskId === task.id)
  const last = mine.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]

  if (!last) return { score: 999, label: 'Noch nie gemacht', color: 'red' }

  const daysSince = (Date.now() - new Date(last.completedAt).getTime()) / 86400000
  const cycle     = task.recurrenceDays ?? 7
  const score     = daysSince / cycle
  const daysLeft  = Math.ceil(cycle - daysSince)

  if (score >= 1)    return { score, label: `${Math.floor(daysSince - cycle) + 1}T überfällig`, color: 'red'    }
  if (score >= 0.75) return { score, label: `In ${daysLeft} Tag(en) fällig`,                    color: 'orange' }
  return               { score, label: `Noch ${daysLeft} Tage`,                                  color: 'gray'   }
}

const URGENCY_COLORS = {
  red:    'bg-red-100 text-red-600',
  orange: 'bg-amber-100 text-amber-600',
  gray:   'bg-gray-100 text-gray-400',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const {
    tasks, categories, completions, currentResidentId,
    isTaskAvailable, completeTask, undoCompletion, getLastCompletion, getMyLastCompletion,
  } = useApp()

  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [view, setView]               = useState<'available' | 'done' | 'vorschlag'>('available')

  const availableCount = tasks.filter(isTaskAvailable).length
  const doneCount      = tasks.length - availableCount

  const vorschlagTasks = tasks
    .filter(t => !selectedCat || t.categoryId === selectedCat)
    .map(t => ({ task: t, urgency: getUrgency(t, completions, currentResidentId) }))
    .filter(({ urgency }) => urgency.score > 0)
    .sort((a, b) => b.urgency.score - a.urgency.score)

  const filtered = tasks.filter(t => {
    const matchCat  = !selectedCat || t.categoryId === selectedCat
    const available = isTaskAvailable(t)
    return matchCat && (view === 'done' ? !available : available)
  })

  return (
    <div className="pb-28">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 pt-14 pb-3 px-4 border-b border-gray-100">
        <h1 className="font-extrabold text-2xl text-gray-900 mb-3">Aufgaben</h1>

        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          <FilterBtn active={view === 'available'} onClick={() => setView('available')}>
            Verfügbar ({availableCount})
          </FilterBtn>
          <FilterBtn active={view === 'done'} onClick={() => setView('done')}>
            Erledigt ({doneCount})
          </FilterBtn>
          <FilterBtn active={view === 'vorschlag'} onClick={() => setView('vorschlag')}>
            💡 Vorschlag
          </FilterBtn>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Pill active={!selectedCat} onClick={() => setSelectedCat(null)}>Alle</Pill>
          {categories.map(cat => (
            <Pill
              key={cat.id}
              active={selectedCat === cat.id}
              onClick={() => setSelectedCat(prev => prev === cat.id ? null : cat.id)}
            >
              {cat.icon} {cat.name}
            </Pill>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">

        {/* ── Vorschlag ── */}
        {view === 'vorschlag' && (
          vorschlagTasks.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-2">✨</p>
              <p className="text-gray-500 font-medium">Alles im grünen Bereich!</p>
            </div>
          ) : vorschlagTasks.map(({ task, urgency }) => {
            const myLast  = getMyLastCompletion(task.id)
            const anyLast = getLastCompletion(task.id)
            const available = isTaskAvailable(task)
            return (
              <div key={task.id}>
                <TaskCard
                  task={task}
                  completed={!available}
                  lastCompletion={anyLast}
                  onComplete={available ? () => completeTask(task) : undefined}
                  onUndo={!available && myLast ? () => undoCompletion(myLast.id) : undefined}
                />
                <div className="flex justify-end -mt-1 mb-1 pr-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCY_COLORS[urgency.color as keyof typeof URGENCY_COLORS]}`}>
                    {urgency.label}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* ── Available / Done ── */}
        {view !== 'vorschlag' && (
          filtered.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-2">{view === 'done' ? '🎯' : '🎉'}</p>
              <p className="text-gray-500 font-medium">
                {view === 'done' ? 'Noch nichts erledigt' : 'Hier ist alles sauber!'}
              </p>
            </div>
          ) : filtered.map(task => {
            const myLast  = getMyLastCompletion(task.id)
            const anyLast = getLastCompletion(task.id)
            return (
              <TaskCard
                key={task.id}
                task={task}
                completed={!isTaskAvailable(task)}
                lastCompletion={anyLast}
                onComplete={() => completeTask(task)}
                onUndo={view === 'done' && myLast ? () => undoCompletion(myLast.id) : undefined}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function FilterBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${active ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}
    >
      {children}
    </button>
  )
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
    >
      {children}
    </button>
  )
}
