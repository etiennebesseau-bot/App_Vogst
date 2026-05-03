import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import LevelBadge from '../components/LevelBadge'
import TaskCard from '../components/TaskCard'

export default function DashboardPage() {
  const {
    currentResident,
    currentApartment,
    getResidentStats,
    tasks,
    isTaskAvailable,
    completeTask,
    clearResident,
  } = useApp()
  const navigate = useNavigate()

  if (!currentResident || !currentApartment) {
    navigate('/')
    return null
  }

  const stats = getResidentStats(currentResident.id)
  const availableTasks = tasks.filter(isTaskAvailable).slice(0, 3)

  return (
    <div className="pb-28">
      <div
        className="px-6 pt-14 pb-8 rounded-b-3xl"
        style={{ backgroundColor: currentApartment.color }}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{currentResident.emoji}</div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                {currentApartment.name}
              </p>
              <h1 className="font-extrabold text-2xl text-white leading-tight">
                {currentResident.name}
              </h1>
              <LevelBadge levelInfo={stats.levelInfo} small />
            </div>
          </div>
          <button
            onClick={() => { clearResident(); navigate('/') }}
            className="text-white/60 text-xs mt-1 hover:text-white transition-colors"
          >
            Wechseln
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Gesamt"  value={stats.totalPoints}  unit="Pkt." />
          <StatCard label="Woche"   value={stats.weeklyPoints} unit="Pkt." />
          <StatCard label="Streak"  value={stats.streak}       unit="🔥"   />
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg text-gray-900">Aktuelle Aufgaben</h2>
          <button onClick={() => navigate('/tasks')} className="text-violet-600 text-sm font-semibold">
            Alle →
          </button>
        </div>

        {availableTasks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-gray-500 font-medium">Alles erledigt!</p>
            <p className="text-gray-400 text-sm">Klasse, komm morgen wieder.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableTasks.map(task => (
              <TaskCard key={task.id} task={task} onComplete={() => completeTask(task)} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        <h2 className="font-bold text-lg text-gray-900 mb-3">Deine Aktivität</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-gray-900">{stats.completionsCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Aufgaben erledigt</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-3xl font-extrabold" style={{ color: stats.levelInfo.color }}>
              {stats.levelInfo.emoji}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Level: {stats.levelInfo.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-white/20 rounded-xl p-3 text-center">
      <p className="text-xs text-white/70 font-medium">{label}</p>
      <p className="font-extrabold text-xl text-white mt-0.5">{value}</p>
      <p className="text-xs text-white/80">{unit}</p>
    </div>
  )
}
