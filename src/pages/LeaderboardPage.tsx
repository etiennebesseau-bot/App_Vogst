import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Kudos, TaskCompletion } from '../types'

const MEDALS = ['🥇', '🥈', '🥉']
const MONTH_FULL = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

type Tab = 'teams-total' | 'solo-total' | 'teams-month' | 'solo-month' | 'stats'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ptsInMonth(comps: TaskCompletion[], residentId: string, y: number, m: number) {
  const start = new Date(y, m, 1).getTime()
  const end   = new Date(y, m + 1, 1).getTime()
  return comps
    .filter(c => c.residentId === residentId && new Date(c.completedAt).getTime() >= start && new Date(c.completedAt).getTime() < end)
    .reduce((s, c) => s + c.pointsEarned, 0)
}

function kudosInMonth(kudos: Kudos[], residentId: string, y: number, m: number) {
  const start = new Date(y, m, 1).getTime()
  const end   = new Date(y, m + 1, 1).getTime()
  return kudos
    .filter(k => k.toResidentId === residentId && new Date(k.createdAt).getTime() >= start && new Date(k.createdAt).getTime() < end)
    .length
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { residents, apartments, completions, kudos, currentResidentId, giveKudo, hasGivenKudoToday, getResidentStats, refresh } = useApp()

  const now = new Date()
  const [tab, setTab]           = useState<Tab>('teams-total')
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (isCurrentMonth) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // ── Gesamt individual ──────────────────────────────────────────────────────
  const soloTotal = useMemo(() =>
    residents
      .map(r => ({ r, apt: apartments.find(a => a.id === r.apartmentId)!, pts: getResidentStats(r.id).totalPoints }))
      .sort((a, b) => b.pts - a.pts),
  [residents, apartments, getResidentStats])

  // ── Gesamt teams ──────────────────────────────────────────────────────────
  const teamsTotal = useMemo(() =>
    apartments
      .map(apt => {
        const members = residents.filter(r => r.apartmentId === apt.id)
        const pts = members.reduce((s, r) => s + getResidentStats(r.id).totalPoints, 0)
        return { apt, members, pts }
      })
      .sort((a, b) => b.pts - a.pts),
  [apartments, residents, getResidentStats])

  // ── Monthly individual ─────────────────────────────────────────────────────
  const soloMonth = useMemo(() =>
    residents
      .map(r => ({
        r,
        apt: apartments.find(a => a.id === r.apartmentId)!,
        pts: ptsInMonth(completions, r.id, viewYear, viewMonth) + kudosInMonth(kudos, r.id, viewYear, viewMonth),
      }))
      .sort((a, b) => b.pts - a.pts),
  [residents, apartments, completions, kudos, viewYear, viewMonth])

  // ── Monthly teams ──────────────────────────────────────────────────────────
  const teamsMonth = useMemo(() =>
    apartments
      .map(apt => {
        const members = residents.filter(r => r.apartmentId === apt.id)
        const pts = members.reduce((s, r) =>
          s + ptsInMonth(completions, r.id, viewYear, viewMonth) + kudosInMonth(kudos, r.id, viewYear, viewMonth), 0)
        return { apt, members, pts }
      })
      .sort((a, b) => b.pts - a.pts),
  [apartments, residents, completions, kudos, viewYear, viewMonth])

  // ── Stats historique ───────────────────────────────────────────────────────
  const monthsWithData = useMemo(() => {
    const seen = new Set<string>()
    completions.forEach(c => {
      const d = new Date(c.completedAt)
      seen.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    return [...seen]
      .map(s => { const [y, m] = s.split('-').map(Number); return { y, m } })
      .sort((a, b) => b.y - a.y || b.m - a.m)
  }, [completions])

  const statsData = useMemo(() =>
    monthsWithData.map(({ y, m }) => {
      const indiv = residents
        .map(r => ({ r, pts: ptsInMonth(completions, r.id, y, m) + kudosInMonth(kudos, r.id, y, m) }))
        .sort((a, b) => b.pts - a.pts)
      const teams = apartments
        .map(apt => ({
          apt,
          pts: residents.filter(r => r.apartmentId === apt.id)
            .reduce((s, r) => s + ptsInMonth(completions, r.id, y, m) + kudosInMonth(kudos, r.id, y, m), 0),
        }))
        .sort((a, b) => b.pts - a.pts)
      return { y, m, indiv, teams }
    }),
  [monthsWithData, residents, apartments, completions, kudos])

  const myAptId = residents.find(r => r.id === currentResidentId)?.apartmentId

  // ─── Render ───────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: 'teams-total', label: 'Teams ges.' },
    { id: 'solo-total',  label: 'Solo ges.'  },
    { id: 'teams-month', label: 'Teams/Mon.' },
    { id: 'solo-month',  label: 'Solo/Mon.'  },
    { id: 'stats',       label: '📊 Stats'   },
  ]

  const needsMonthNav = tab === 'teams-month' || tab === 'solo-month'

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-violet-600 pt-14 pb-5 px-4 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-extrabold text-2xl text-white">Rangliste</h1>
          <button onClick={refresh} className="text-white/60 text-xl active:scale-90 transition-transform">🔄</button>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-white text-violet-600' : 'bg-white/20 text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Month navigation */}
        {needsMonthNav && (
          <div className="flex items-center justify-between mt-3 bg-white/10 rounded-xl px-3 py-2">
            <button onClick={prevMonth} className="text-white text-lg px-1 active:scale-90 transition-transform">‹</button>
            <span className="text-white font-semibold text-sm">{MONTH_FULL[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className={`text-lg px-1 transition-transform active:scale-90 ${isCurrentMonth ? 'text-white/20' : 'text-white'}`}>›</button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">

        {/* ── Teams Gesamt ── */}
        {tab === 'teams-total' && (
          <>
            <p className="text-xs text-gray-400 text-center">Punkte seit Beginn · alle Teams</p>
            {teamsTotal.map((entry, i) => (
              <TeamCard key={entry.apt.id} entry={entry} index={i} isMyTeam={entry.apt.id === myAptId} />
            ))}
          </>
        )}

        {/* ── Solo Gesamt ── */}
        {tab === 'solo-total' && (
          <>
            <Podium entries={soloTotal} />
            {soloTotal.map((entry, i) => (
              <SoloCard
                key={entry.r.id}
                entry={entry}
                index={i}
                isMe={entry.r.id === currentResidentId}
                canKudo={!!currentResidentId && entry.r.id !== currentResidentId && entry.r.apartmentId !== myAptId}
                alreadyGave={hasGivenKudoToday(entry.r.id)}
                onKudo={() => giveKudo(entry.r.id)}
                stats={getResidentStats(entry.r.id)}
              />
            ))}
          </>
        )}

        {/* ── Teams Monat ── */}
        {tab === 'teams-month' && (
          <>
            <p className="text-xs text-gray-400 text-center">Team mit den wenigsten Punkten lädt ein 🍽️</p>
            {teamsMonth.map((entry, i) => (
              <TeamCard key={entry.apt.id} entry={entry} index={i} isMyTeam={entry.apt.id === myAptId} />
            ))}
          </>
        )}

        {/* ── Solo Monat ── */}
        {tab === 'solo-month' && (
          <>
            <Podium entries={soloMonth} />
            {soloMonth.map((entry, i) => (
              <SoloCard
                key={entry.r.id}
                entry={entry}
                index={i}
                isMe={entry.r.id === currentResidentId}
                canKudo={!!currentResidentId && entry.r.id !== currentResidentId && entry.r.apartmentId !== myAptId}
                alreadyGave={hasGivenKudoToday(entry.r.id)}
                onKudo={() => giveKudo(entry.r.id)}
              />
            ))}
          </>
        )}

        {/* ── Stats historique ── */}
        {tab === 'stats' && (
          statsData.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-gray-400">Noch keine Daten</p>
            </div>
          ) : statsData.map(({ y, m, indiv, teams }) => (
            <div key={`${y}-${m}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-violet-50 px-4 py-2.5 border-b border-violet-100">
                <p className="font-bold text-violet-700 text-sm">{MONTH_FULL[m]} {y}</p>
              </div>
              <div className="p-3 flex gap-3">
                {/* Team winner */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium mb-2">🏠 Teams</p>
                  {teams.slice(0, 3).map((t, i) => (
                    <div key={t.apt.id} className="flex items-center gap-2 mb-1">
                      <span className="text-sm w-4">{MEDALS[i]}</span>
                      <span className="text-sm">{t.apt.emoji}</span>
                      <span className="text-xs text-gray-600 truncate flex-1">{t.apt.name.replace('Team ', '')}</span>
                      <span className="text-xs font-bold text-gray-700">{t.pts}</span>
                    </div>
                  ))}
                </div>
                <div className="w-px bg-gray-100 self-stretch" />
                {/* Top 3 individuals */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium mb-2">👤 Solo</p>
                  {indiv.slice(0, 3).map((entry, i) => (
                    <div key={entry.r.id} className="flex items-center gap-2 mb-1">
                      <span className="text-sm w-4">{MEDALS[i]}</span>
                      <span className="text-sm">{entry.r.emoji}</span>
                      <span className="text-xs text-gray-600 truncate flex-1">{entry.r.name}</span>
                      <span className="text-xs font-bold text-gray-700">{entry.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TeamCard({ entry, index, isMyTeam }: {
  entry: { apt: { id: string; name: string; color: string; emoji: string }; members: any[]; pts: number }
  index: number
  isMyTeam: boolean
}) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${isMyTeam ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 text-center font-bold text-lg text-gray-500">
          {index < 3 ? MEDALS[index] : index + 1}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: entry.apt.color + '22' }}>
          {entry.apt.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{entry.apt.name}</span>
            {isMyTeam && <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full">Mein Team</span>}
          </div>
          <div className="flex gap-1 mt-1">{entry.members.map((r: any) => <span key={r.id} className="text-sm">{r.emoji}</span>)}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-extrabold text-2xl text-gray-900">{entry.pts}</p>
          <p className="text-xs text-gray-400">Pkt.</p>
        </div>
      </div>
    </div>
  )
}

function SoloCard({ entry, index, isMe, canKudo, alreadyGave, onKudo, stats }: {
  entry: { r: any; apt: any; pts: number }
  index: number
  isMe: boolean
  canKudo: boolean
  alreadyGave: boolean
  onKudo: () => void
  stats?: any
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${isMe ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-white'}`}>
      <div className="w-8 text-center font-bold text-lg text-gray-500">{index < 3 ? MEDALS[index] : index + 1}</div>
      <div className="text-3xl">{entry.r.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 truncate">{entry.r.name}</span>
          {isMe && <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full">Ich</span>}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <span style={{ color: entry.apt.color }}>●</span>
          {entry.apt.name}
          {stats && <><span className="mx-1">·</span>{stats.levelInfo.emoji} {stats.levelInfo.name}</>}
          {stats?.streak > 1 && <span className="ml-1">· 🔥{stats.streak}T</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {canKudo && (
          <button
            onClick={() => !alreadyGave && onKudo()}
            className={`text-xl transition-all active:scale-125 ${alreadyGave ? 'opacity-30' : 'hover:scale-110'}`}
            title={alreadyGave ? 'Heute schon vergeben' : '+1 Punkt geben'}
          >🤝</button>
        )}
        <div className="text-right">
          <p className="font-extrabold text-xl text-gray-900">{entry.pts}</p>
          <p className="text-xs text-gray-400">Pkt.</p>
        </div>
      </div>
    </div>
  )
}

function Podium({ entries }: { entries: { r: any; apt: any; pts: number }[] }) {
  if (entries.length < 3) return null
  const order = [entries[1], entries[0], entries[2]]
  const heights = ['h-24', 'h-32', 'h-20']
  const ranks = [1, 0, 2]
  return (
    <div className="flex justify-center items-end gap-4 px-4 mt-2 mb-2">
      {order.map((entry, i) => (
        <div key={entry.r.id} className="flex flex-col items-center gap-1">
          <span className="text-2xl">{entry.r.emoji}</span>
          <span className="text-xs font-semibold text-gray-600">{entry.r.name}</span>
          <div
            className={`${heights[i]} w-20 rounded-t-xl flex flex-col items-center justify-center`}
            style={{ backgroundColor: entry.apt.color + '33', border: `2px solid ${entry.apt.color}` }}
          >
            <span className="text-xl">{MEDALS[ranks[i]]}</span>
            <span className="font-bold text-sm text-gray-800">{entry.pts}</span>
            <span className="text-xs text-gray-500">Pkt.</span>
          </div>
        </div>
      ))}
    </div>
  )
}
