import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, deleteCompletion, deleteCompletionsByResident, deleteAllCompletions } from '../lib/supabase'
import { RESIDENTS, APARTMENTS, TASKS } from '../data/initial'
import { TaskCompletion } from '../types'

const ADMIN_PIN = '3242'

export default function AdminPage() {
  const [pin, setPin]           = useState('')
  const [pinError, setPinError] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const navigate = useNavigate()

  function checkPin() {
    if (pin === ADMIN_PIN) {
      setUnlocked(true)
    } else {
      setPinError(true)
      setPin('')
      setTimeout(() => setPinError(false), 1000)
    }
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('task_completions')
      .select('*')
      .order('completed_at', { ascending: false })
    setCompletions(
      (data ?? []).map(row => ({
        id:           row.id,
        taskId:       row.task_id,
        residentId:   row.resident_id,
        completedAt:  row.completed_at,
        pointsEarned: row.points_earned,
      })),
    )
    setLoading(false)
  }

  useEffect(() => { if (unlocked) load() }, [unlocked])

  async function handleDeleteOne(id: string) {
    await deleteCompletion(id)
    setCompletions(prev => prev.filter(c => c.id !== id))
  }

  async function handleResetResident(residentId: string) {
    if (!confirm('Alle Einträge für diesen Bewohner löschen?')) return
    await deleteCompletionsByResident(residentId)
    setCompletions(prev => prev.filter(c => c.residentId !== residentId))
  }

  async function handleResetAll() {
    if (!confirm('Wirklich ALLE Punkte für alle zurücksetzen?')) return
    await deleteAllCompletions()
    setCompletions([])
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm w-full max-w-sm">
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="font-extrabold text-xl text-gray-900 mt-2">Admin</h1>
          </div>
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkPin()}
            className={`w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-widest mb-4 outline-none transition-colors ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-violet-400'}`}
            maxLength={4}
          />
          {pinError && <p className="text-red-500 text-xs text-center -mt-2 mb-3">Falscher PIN</p>}
          <button
            onClick={checkPin}
            className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Weiter
          </button>
          <button onClick={() => navigate('/')} className="w-full text-gray-400 text-sm mt-3 py-2">
            Zurück
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gray-900 pt-14 pb-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="font-extrabold text-xl text-white">🔐 Admin</h1>
          <div className="flex items-center gap-3">
            <button onClick={load} className="text-white/60 text-lg active:scale-95 transition-transform">🔄</button>
            <button onClick={() => navigate('/dashboard')} className="text-white/60 text-sm">Zurück</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-lg">Laden…</div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          <button
            onClick={handleResetAll}
            className="w-full bg-red-50 border border-red-200 text-red-600 font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-transform"
          >
            ⚠️ Alle Punkte zurücksetzen
          </button>

          {RESIDENTS.map(resident => {
            const apt   = APARTMENTS.find(a => a.id === resident.apartmentId)!
            const mine  = completions.filter(c => c.residentId === resident.id)
            const totalPts = mine.reduce((s, c) => s + c.pointsEarned, 0)
            const now   = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthPts   = mine.filter(c => new Date(c.completedAt) >= monthStart).reduce((s, c) => s + c.pointsEarned, 0)
            const isOpen = expanded === resident.id

            return (
              <div key={resident.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : resident.id)}
                >
                  <span className="text-2xl">{resident.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{resident.name}</p>
                    <p className="text-xs font-medium" style={{ color: apt.color }}>{apt.name}</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="font-bold text-gray-900">{totalPts} Pkt. gesamt</p>
                    <p className="text-xs text-gray-400">{monthPts} Pkt. diesen Monat · {mine.length} Einträge</p>
                  </div>
                  <span className="text-gray-300">{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    <div className="px-4 py-2 bg-gray-50 flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Einträge</span>
                      <button
                        onClick={() => handleResetResident(resident.id)}
                        className="text-xs text-red-500 font-semibold bg-red-50 px-3 py-1 rounded-full"
                      >
                        Alle löschen
                      </button>
                    </div>
                    {mine.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-4">Keine Einträge</p>
                    ) : (
                      mine.map(c => {
                        const task = TASKS.find(t => t.id === c.taskId)
                        return (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 font-medium truncate">{task?.title ?? c.taskId}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(c.completedAt).toLocaleDateString('de-DE', {
                                  day: '2-digit', month: '2-digit', year: '2-digit',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-violet-600 flex-shrink-0">+{c.pointsEarned}</span>
                            <button
                              onClick={() => handleDeleteOne(c.id)}
                              className="text-red-300 hover:text-red-500 text-xl leading-none pl-2 flex-shrink-0 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
