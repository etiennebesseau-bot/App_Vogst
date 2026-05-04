import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase, fetchExpenses, insertExpense, deleteExpense, mapExpense } from '../lib/supabase'
import { RESIDENTS, APARTMENTS } from '../data/initial'
import { Expense } from '../types'

// ─── Settlement algorithm ─────────────────────────────────────────────────────

function calculateSettlements(expenses: Expense[]) {
  const balance: Record<string, number> = {}
  RESIDENTS.forEach(r => { balance[r.id] = 0 })

  expenses.forEach(exp => {
    const share = exp.amount / exp.participants.length
    balance[exp.paidBy] += exp.amount
    exp.participants.forEach(p => { balance[p] -= share })
  })

  const creds = Object.entries(balance).filter(([, v]) => v > 0.005).map(([id, amt]) => ({ id, amt })).sort((a, b) => b.amt - a.amt)
  const debs  = Object.entries(balance).filter(([, v]) => v < -0.005).map(([id, amt]) => ({ id, amt: -amt })).sort((a, b) => b.amt - a.amt)

  const settlements: { from: string; to: string; amount: number }[] = []
  let ci = 0, di = 0
  while (ci < creds.length && di < debs.length) {
    const payment = Math.min(creds[ci].amt, debs[di].amt)
    if (payment > 0.005) settlements.push({ from: debs[di].id, to: creds[ci].id, amount: Math.round(payment * 100) / 100 })
    creds[ci].amt -= payment
    debs[di].amt  -= payment
    if (creds[ci].amt < 0.005) ci++
    if (debs[di].amt  < 0.005) di++
  }
  return { balance, settlements }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function residentById(id: string) { return RESIDENTS.find(r => r.id === id) }
function aptByResident(id: string) { const r = residentById(id); return r ? APARTMENTS.find(a => a.id === r.apartmentId) : undefined }
function fmt(n: number) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KassePage() {
  const { currentResidentId } = useApp()
  const [expenses, setExpenses]     = useState<Expense[]>([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'ausgaben' | 'abrechnung'>('ausgaben')
  const [showForm, setShowForm]     = useState(false)

  // Form
  const [desc, setDesc]             = useState('')
  const [amount, setAmount]         = useState('')
  const [paidBy, setPaidBy]         = useState(currentResidentId ?? RESIDENTS[0].id)
  const [parts, setParts]           = useState<string[]>(RESIDENTS.map(r => r.id))
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    fetchExpenses().then(setExpenses).catch(console.error).finally(() => setLoading(false))

    const ch = supabase.channel('expenses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses' },
        p => setExpenses(prev => prev.some(e => e.id === (p.new as Record<string,unknown>).id) ? prev : [mapExpense(p.new as Record<string,unknown>), ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' },
        p => setExpenses(prev => prev.filter(e => e.id !== (p.old as Record<string,unknown>).id)))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  function togglePart(id: string) {
    setParts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  async function submit() {
    if (!desc.trim() || !amount || parts.length === 0) return
    setSaving(true)
    try {
      await insertExpense({ description: desc.trim(), amount: parseFloat(amount.replace(',', '.')), paidBy, participants: parts })
      setShowForm(false)
      setDesc('')
      setAmount('')
      setParts(RESIDENTS.map(r => r.id))
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Ausgabe löschen?')) return
    await deleteExpense(id)
  }

  const now         = new Date()
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthTotal  = expenses.filter(e => new Date(e.createdAt) >= monthStart).reduce((s, e) => s + e.amount, 0)
  const { balance, settlements } = calculateSettlements(expenses)

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-emerald-600 pt-14 pb-8 px-4 rounded-b-3xl">
        <h1 className="font-extrabold text-2xl text-white mb-1">Kasse</h1>
        <p className="text-white/60 text-xs mb-4">Diesen Monat: {fmt(monthTotal)} €</p>
        <div className="flex gap-2">
          <TabBtn active={tab === 'ausgaben'}   onClick={() => setTab('ausgaben')}>Ausgaben</TabBtn>
          <TabBtn active={tab === 'abrechnung'} onClick={() => setTab('abrechnung')}>Abrechnung</TabBtn>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Laden…</div>
      ) : (
        <>
          {/* ── Ausgaben tab ── */}
          {tab === 'ausgaben' && (
            <div className="px-4 mt-4 space-y-2">
              {expenses.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-2">💸</p>
                  <p className="text-gray-500 font-medium">Noch keine Ausgaben</p>
                  <p className="text-gray-400 text-sm">Tippe + um eine hinzuzufügen</p>
                </div>
              ) : expenses.map(exp => {
                const payer = residentById(exp.paidBy)
                const apt   = aptByResident(exp.paidBy)
                const share = exp.amount / exp.participants.length
                const isMe  = exp.paidBy === currentResidentId || exp.participants.includes(currentResidentId ?? '')
                return (
                  <div key={exp.id} className={`bg-white rounded-2xl border-2 p-4 ${isMe ? 'border-emerald-200' : 'border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{exp.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(exp.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-base">{payer?.emoji}</span>
                          <span className="text-xs font-medium" style={{ color: apt?.color }}>{payer?.name}</span>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs text-gray-400">{fmt(share)} € / Person</span>
                        </div>
                        <div className="flex gap-0.5 mt-1.5">
                          {exp.participants.map(pid => (
                            <span key={pid} className="text-sm">{residentById(pid)?.emoji}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                        <p className="font-extrabold text-xl text-gray-900">{fmt(exp.amount)} €</p>
                        {exp.paidBy === currentResidentId && (
                          <button onClick={() => handleDelete(exp.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors">×</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Abrechnung tab ── */}
          {tab === 'abrechnung' && (
            <div className="px-4 mt-4 space-y-4">
              {/* Net balances */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kontostand</p>
                </div>
                {RESIDENTS.map(r => {
                  const bal = balance[r.id] ?? 0
                  const apt = APARTMENTS.find(a => a.id === r.apartmentId)!
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <span className="text-2xl">{r.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                        <p className="text-xs font-medium" style={{ color: apt.color }}>{apt.name}</p>
                      </div>
                      <p className={`font-bold text-base ${bal > 0.005 ? 'text-emerald-600' : bal < -0.005 ? 'text-red-500' : 'text-gray-400'}`}>
                        {bal > 0.005 ? '+' : ''}{fmt(bal)} €
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Settlements */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Vorgeschlagene Zahlungen</p>
                {settlements.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-1">✅</p>
                    <p className="text-gray-500 text-sm font-medium">Alles ausgeglichen!</p>
                  </div>
                ) : settlements.map((s, i) => {
                  const from = residentById(s.from)
                  const to   = residentById(s.to)
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 mb-2 flex items-center gap-3 shadow-sm">
                      <span className="text-2xl">{from?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {from?.name} → {to?.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{from?.name} zahlt {to?.name}</p>
                      </div>
                      <p className="font-extrabold text-lg text-gray-900 flex-shrink-0">{fmt(s.amount)} €</p>
                      <span className="text-2xl">{to?.emoji}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Floating add button ── */}
      <button
        onClick={() => { setPaidBy(currentResidentId ?? RESIDENTS[0].id); setShowForm(true) }}
        className="fixed bottom-32 right-4 w-14 h-14 bg-emerald-600 text-white text-3xl rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        +
      </button>

      {/* ── Add expense modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 space-y-4">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <h2 className="font-extrabold text-xl text-gray-900">Neue Ausgabe</h2>

            <input
              placeholder="Beschreibung (z.B. Pizza)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-emerald-400"
            />

            <div className="relative">
              <input
                placeholder="0.00"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-emerald-400 pr-10"
              />
              <span className="absolute right-4 top-3.5 text-gray-400 font-semibold">€</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wer hat bezahlt?</p>
              <div className="grid grid-cols-3 gap-2">
                {RESIDENTS.map(r => {
                  const apt = APARTMENTS.find(a => a.id === r.apartmentId)!
                  return (
                    <button
                      key={r.id}
                      onClick={() => setPaidBy(r.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${paidBy === r.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100'}`}
                    >
                      <span className="text-xl">{r.emoji}</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{r.name}</span>
                      <span className="text-xs" style={{ color: apt.color }}>{apt.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wer ist dabei?</p>
                <button
                  onClick={() => setParts(parts.length === RESIDENTS.length ? [] : RESIDENTS.map(r => r.id))}
                  className="text-xs text-emerald-600 font-semibold"
                >
                  {parts.length === RESIDENTS.length ? 'Alle abwählen' : 'Alle wählen'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {RESIDENTS.map(r => {
                  const selected = parts.includes(r.id)
                  const apt = APARTMENTS.find(a => a.id === r.apartmentId)!
                  return (
                    <button
                      key={r.id}
                      onClick={() => togglePart(r.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 opacity-50'}`}
                    >
                      <span className="text-xl">{r.emoji}</span>
                      <span className="text-xs font-semibold text-gray-800 mt-0.5">{r.name}</span>
                      <span className="text-xs" style={{ color: apt.color }}>{apt.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={submit}
              disabled={saving || !desc.trim() || !amount || parts.length === 0}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {saving ? 'Speichern…' : 'Hinzufügen'}
            </button>
            <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}>
      {children}
    </button>
  )
}
