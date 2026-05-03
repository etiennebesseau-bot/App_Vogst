import { useState } from 'react'
import { useApp } from '../context/AppContext'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { residents, apartments, getResidentStats, currentResidentId } = useApp()
  const [period, setPeriod] = useState<'weekly' | 'total'>('weekly')

  const ranked = residents
    .map(r => ({
      resident:  r,
      apartment: apartments.find(a => a.id === r.apartmentId)!,
      stats:     getResidentStats(r.id),
    }))
    .sort((a, b) => {
      const ap = period === 'weekly' ? a.stats.weeklyPoints : a.stats.totalPoints
      const bp = period === 'weekly' ? b.stats.weeklyPoints : b.stats.totalPoints
      return bp - ap
    })

  return (
    <div className="pb-28">
      <div className="bg-violet-600 pt-14 pb-8 px-4 rounded-b-3xl">
        <h1 className="font-extrabold text-2xl text-white mb-4">Rangliste</h1>
        <div className="flex gap-2">
          <TabBtn active={period === 'weekly'} onClick={() => setPeriod('weekly')}>
            Diese Woche
          </TabBtn>
          <TabBtn active={period === 'total'} onClick={() => setPeriod('total')}>
            Gesamt
          </TabBtn>
        </div>
      </div>

      {/* Podium */}
      {ranked.length >= 3 && (
        <div className="flex justify-center items-end gap-4 px-4 mt-6 mb-2">
          {[ranked[1], ranked[0], ranked[2]].map((entry, i) => {
            const pts = period === 'weekly' ? entry.stats.weeklyPoints : entry.stats.totalPoints
            const heights = ['h-24', 'h-32', 'h-20']
            const ranks = [1, 0, 2]
            return (
              <div key={entry.resident.id} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{entry.resident.emoji}</span>
                <span className="text-xs font-semibold text-gray-600">{entry.resident.name}</span>
                <div
                  className={`${heights[i]} w-20 rounded-t-xl flex flex-col items-center justify-center`}
                  style={{
                    backgroundColor: entry.apartment.color + '33',
                    border: `2px solid ${entry.apartment.color}`,
                  }}
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
          const pts = period === 'weekly' ? entry.stats.weeklyPoints : entry.stats.totalPoints
          const isMe = entry.resident.id === currentResidentId

          return (
            <div
              key={entry.resident.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${
                isMe ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="w-8 text-center font-bold text-lg text-gray-500">
                {index < 3 ? MEDALS[index] : index + 1}
              </div>
              <div className="text-3xl">{entry.resident.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate">{entry.resident.name}</span>
                  {isMe && (
                    <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      Ich
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <span style={{ color: entry.apartment.color }}>●</span>
                  {entry.apartment.name}
                  <span className="mx-1">·</span>
                  {entry.stats.levelInfo.emoji} {entry.stats.levelInfo.name}
                  {entry.stats.streak > 1 && <span className="ml-1">· 🔥 {entry.stats.streak}T</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-extrabold text-xl text-gray-900">{pts}</p>
                <p className="text-xs text-gray-400">Pkt.</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabBtn({
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
      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
        active ? 'bg-white text-violet-600' : 'bg-white/20 text-white'
      }`}
    >
      {children}
    </button>
  )
}
