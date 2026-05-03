import { useState } from 'react'
import { useApp } from '../context/AppContext'
import TaskCard from '../components/TaskCard'

export default function TasksPage() {
  const { tasks, categories, isTaskAvailable, completeTask, getLastCompletion } = useApp()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const filtered = tasks.filter(t => {
    const matchCat = !selectedCat || t.categoryId === selectedCat
    const available = isTaskAvailable(t)
    return matchCat && (showDone ? !available : available)
  })

  const availableCount = tasks.filter(isTaskAvailable).length
  const doneCount = tasks.length - availableCount

  return (
    <div className="pb-28">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 pt-14 pb-3 px-4 border-b border-gray-100">
        <h1 className="font-extrabold text-2xl text-gray-900 mb-3">Aufgaben</h1>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowDone(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              !showDone ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Verfügbar ({availableCount})
          </button>
          <button
            onClick={() => setShowDone(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              showDone ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Erledigt ({doneCount})
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Pill active={!selectedCat} onClick={() => setSelectedCat(null)}>Alle</Pill>
          {categories.map(cat => (
            <Pill
              key={cat.id}
              active={selectedCat === cat.id}
              onClick={() => setSelectedCat(prev => (prev === cat.id ? null : cat.id))}
            >
              {cat.icon} {cat.name}
            </Pill>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-2">{showDone ? '🎯' : '🎉'}</p>
            <p className="text-gray-500 font-medium">
              {showDone ? 'Noch nichts erledigt' : 'Hier ist alles sauber!'}
            </p>
          </div>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              completed={!isTaskAvailable(task)}
              lastCompletion={getLastCompletion(task.id)}
              onComplete={() => completeTask(task)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {children}
    </button>
  )
}
