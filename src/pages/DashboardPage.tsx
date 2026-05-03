import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { usePushNotifications } from '../hooks/usePushNotifications'
import LevelBadge from '../components/LevelBadge'
import TaskCard from '../components/TaskCard'

export default function DashboardPage() {
  const { currentResident, currentApartment, getResidentStats, tasks, isTaskAvailable, completeTask, clearResident, refresh } = useApp()
  const { permission, subscribed, subscribe } = usePushNotifications()
  const navigate = useNavigate()

  if (!currentResident || !currentApartment) {
    navigate('/')
    return null
  }

  const stats = getResidentStats(currentResident.id)
  const availableTasks = tasks.filter(isTaskAvailable).slice(0, 3)
  const showNotifBanner = permission === 'default' && !subscribed

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-8 rounded-b-3xl" style={{ backgroundColor: currentApartment.color }}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{currentResident.emoji}</div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">{currentApartment.name}</p>
              <h1 className="font-extrabold text-2xl text-white leading-tight">{currentResident.name}</h1>
              <LevelBadge levelInfo={stats.levelInfo} small />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => { clearResident(); navigate('/') }} className="text-white/60 text-xs hover:text-white transition-colors">
              Wechseln
            </button>
            <button onClick={refresh} className="text-white/60 text-xl active:scale-90 transition-transform leading-none">🔄</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Gesamt"  value={stats.totalPoints}   unit="Pkt." />
          <StatCard label="Monat"   value={stats.monthlyPoints} unit="Pkt." />
          <StatCard label="Streak"  value={stats.streak}        unit="🔥"   />
        </div>
      </div>

      {/* Notification banner */}
      {showNotifBanner && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">Müll-Erinnerungen aktivieren</p>
            <p className="text-amber-700 text-xs mt-0.5">Benachrichtigung am Vorabend um 18:00 Uhr</p>
          </div>
          <button
            onClick={subscribe}
            className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
          >
            Aktivieren
          </button>
        </div>
      )}
      {subscribed && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-green-800 text-sm font-medium">Müll-Erinnerungen aktiv</p>
        </div>
      )}

      {/* Quick tasks */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg text-gray-900">Aktuelle Aufgaben</h2>
          <button onClick={() => navigate('/tasks')} className="text-violet-600 text-sm font-semibold">Alle →</button>
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

      {/* Stats */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-lg text-gray-900 mb-3">Deine Aktivität</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-gray-900">{stats.completionsCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Aufgaben erledigt</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-3xl font-extrabold" style={{ color: stats.levelInfo.color }}>{stats.levelInfo.emoji}</p>
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
