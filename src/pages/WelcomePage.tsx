import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Apartment, Resident } from '../types'

export default function WelcomePage() {
  const { apartments, residents, selectResident, getResidentStats } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null)

  useEffect(() => {
    const apt = searchParams.get('apt')
    if (apt) {
      const found = apartments.find(a => a.id === `apt-${apt.toLowerCase()}`)
      if (found) setSelectedApt(found)
    }
  }, [apartments, searchParams])

  function handleResident(resident: Resident) {
    selectResident(resident.id)
    navigate('/dashboard')
  }

  const aptResidents = selectedApt
    ? residents.filter(r => r.apartmentId === selectedApt.id)
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🏠</div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vogesenstrasse</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {selectedApt ? 'Wer bist du?' : 'Wähle dein Apartment'}
          </p>
        </div>

        {!selectedApt ? (
          <div className="space-y-3">
            {apartments.map(apt => {
              const aptResidents = residents.filter(r => r.apartmentId === apt.id)
              return (
                <button
                  key={apt.id}
                  onClick={() => setSelectedApt(apt)}
                  className="w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-95 hover:shadow-md"
                  style={{ borderColor: apt.color, backgroundColor: apt.bgColor }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{apt.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900">{apt.name}</div>
                      <div className="text-sm text-gray-500">
                        {aptResidents.map(r => `${r.emoji} ${r.name}`).join('  ·  ')}
                      </div>
                    </div>
                    <span className="text-gray-400 text-xl">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedApt(null)}
              className="flex items-center gap-1 text-gray-400 mb-6 text-sm hover:text-gray-600 transition-colors"
            >
              ← Zurück
            </button>
            <div className="space-y-3">
              {aptResidents.map(resident => {
                const stats = getResidentStats(resident.id)
                return (
                  <button
                    key={resident.id}
                    onClick={() => handleResident(resident)}
                    className="w-full p-5 rounded-2xl border-2 text-left bg-white transition-all active:scale-95 hover:shadow-md"
                    style={{ borderColor: selectedApt.color }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{resident.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-xl text-gray-900">{resident.name}</div>
                        <div className="text-sm text-gray-500">
                          {stats.levelInfo.emoji} {stats.levelInfo.name} · {stats.totalPoints} Pkt.
                        </div>
                      </div>
                      <span className="text-gray-400 text-xl">›</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
