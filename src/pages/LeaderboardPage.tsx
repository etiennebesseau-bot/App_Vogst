import { useState } from 'react'
import { useApp } from '../context/AppContext'

const MEDALS = ['🥇', '🥈', '🥉']
const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

type Period = 'monthly' | 'total' | 'teams'

export default function LeaderboardPage() {
  const { residents, apartments, getResidentStats, currentResidentId, giveKudo, hasGivenKudoToday, refresh } = useApp()
  const [period, setPeriod] = useState<Period>('monthly')

  const currentMonth = MONTH_NAMES[new Date().getMonth()]

  const ranked = residents
    .map(r => ({ resident: r, apartment: apartments.find(a => a.id === r.apartmentId)!, stats: getResidentStats(r.id) }))
    .sort((a, b) => {
      const ap = period === 'monthly' ? a.stats.monthlyPoints : a.stats.totalPoints
      const bp = period === 'monthly' ? b.stats.monthlyPoints : b.stats.totalPoints
      return bp - ap
    })

  const teamRanked = apartments
    .map(apt => {
      const aptResidents = residents.filter(r => r.apartmentId === apt.id)
      const monthlyPts = aptResidents.reduce((s, r) => s + getResidentStats(r.id).monthlyPoints, 0)
      const totalPts   = aptResidents.reduce((s, r) => s + getResidentStats(r.id).totalPoints, 0)
      return { apartment: apt, residents: aptResidents, monthlyPts, totalPts }
    })
    .sort((a, b) => b.monthlyPts - a.monthlyPts)

  const isTeams = period === 'teams'

  return (
    <div className="pb-28">
      <div className="bg-violet-600 pt-14 pb-8 px-4 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-extrabold text-2xl text-white">Rangliste</h1>
          <button onClick={refresh} className="text-white/60 text-xl active:scale-90 transition-transform">🔄</button>
        </div>
        {period === 'monthly' && (
          <p className="text-white/60 text-xs mb-4">Team mit den wenigsten Punkten lädt ein 🍽️</p>
        )}
        {period !== 'monthly' && <div className="mb-4" />}
        <div className="flex gap-2">
          <TabBtn active={period === 'monthly'} onClick={() => setPeriod('monthly')}>{currentMonth}</TabBtn>
          <TabBtn active={period === 'total'}   onClick={() => setPeriod('total')}>Gesamt</TabBtn>
          <TabBtn active={period === 'teams'}   onClick={() => setPeriod('teams')}>Teams</TabBtn>
        </div>
      </div>

      {/* ── Individual ranking ── */}
      {!isTeams && (
        <>
          {ranked.length >= 3 && (
            <div className="flex justify-center items-end gap-4 px-4 mt-6 mb-2">
              {[ranked[1], ranked[0], ranked[2]].map((entry, i) => {
                const pts = period === 'monthly' ? entry.stats.monthlyPoints : entry.stats.totalPoints
                const heights = ['h-24', 'h-32', 'h-20']
                const ranks = [1, 0, 2]
                return (
                  <div key={entry.resident.id} className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{entry.resident.emoji}</span>
                    <span className="text-xs font-semibold text-gray-600">{entry.resident.name}</span>
                    <div
                      className={`${heights[i]} w-20 rounded-t-xl flex flex-col items-center justify-center`}
                      style={{ backgroundColor: entry.apartment.color + '33', border: `2px solid ${entry.apartment.color}` }}
                    >
                      <span className="text-xl">{MEDALS[ranks[i]]}</span>
                      <span className="font-bold text-sm text-gray-800">{pts}</span>
                      <span className="text-xs text-gray-500">Pkt.</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="px-4 mt-4 space-y-2">
            {ranked.map((entry, index) => {
              const pts  = period === 'monthly' ? entry.stats.monthlyPoints : entry.stats.totalPoints
              const isMe = entry.resident.id === currentResidentId
              const myApartmentId = residents.find(r => r.id === currentResidentId)?.apartmentId
              const canKudo = currentResidentId && !isMe && entry.resident.apartmentId !== myApartmentId
              const alreadyGave = canKudo && hasGivenKudoToday(entry.resident.id)
              return (
                <div
                  key={entry.resident.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${isMe ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-white'}`}
                >
                  <div className="w-8 text-center font-bold text-lg text-gray-500">
                    {index < 3 ? MEDALS[index] : index + 1}
                  </div>
                  <div className="text-3xl">{entry.resident.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{entry.resident.name}</span>
                      {isMe && <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full flex-shrink-0">Ich</span>}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <span style={{ color: entry.apartment.color }}>●</span>
                      {entry.apartment.name}
                      <span className="mx-1">·</span>
                      {entry.stats.levelInfo.emoji} {entry.stats.levelInfo.name}
                      {entry.stats.streak > 1 && <span className="ml-1">· 🔥{entry.stats.streak}T</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {canKudo && (
                      <button
                        onClick={() => !alreadyGave && giveKudo(entry.resident.id)}
                        className={`text-xl transition-all active:scale-125 ${alreadyGave ? 'opacity-30' : 'hover:scale-110'}`}
                        title={alreadyGave ? 'Heute schon vergeben' : '+1 Punkt geben'}
                      >
                        🤝
                      </button>
                    )}
                    <div className="text-right">
                      <p className="font-extrabold text-xl text-gray-900">{pts}</p>
                      <p className="text-xs text-gray-400">Pkt.</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Team ranking ── */}
      {isTeams && (
        <div className="px-4 mt-6 space-y-3">
          <p className="text-xs text-gray-400 text-center">Punkte diesen Monat · Team mit den wenigsten lädt ein 🍽️</p>
          {teamRanked.map((entry, index) => {
            const myTeam = residents.find(r => r.id === currentResidentId)?.apartmentId === entry.apartment.id
            return (
              <div
                key={entry.apartment.id}
                className={`rounded-2xl border-2 overflow-hidden ${myTeam ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="w-8 text-center font-bold text-lg text-gray-500">
                    {index < 3 ? MEDALS[index] : index + 1}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ backgroundColor: entry.apartment.color + '22' }}
                  >
                    {entry.apartment.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{entry.apartment.name}</span>
                      {myTeam && <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full flex-shrink-0">Mein Team</span>}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {entry.residents.map(r => (
                        <span key={r.id} className="text-sm">{r.emoji}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-extrabold text-2xl text-gray-900">{entry.monthlyPts}</p>
                    <p className="text-xs text-gray-400">Pkt.</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-2 flex gap-3">
                  {entry.residents.map(r => {
                    const s = getResidentStats(r.id)
                    return (
                      <div key={r.id} className="flex items-center gap-1.5 flex-1">
                        <span className="text-base">{r.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400">{s.monthlyPoints} Pkt.</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-white text-violet-600' : 'bg-white/20 text-white'}`}>
      {children}
    </button>
  )
}
