import { Apartment, Resident, Category, Task, LevelInfo } from '../types'

export const APARTMENTS: Apartment[] = [
  {
    id: 'apt-a',
    name: 'Team Nelly',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    emoji: '🔴',
  },
  {
    id: 'apt-b',
    name: 'Team Ivey',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    emoji: '🟣',
  },
  {
    id: 'apt-c',
    name: 'Team Daisy',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    emoji: '🟢',
  },
]

export const RESIDENTS: Resident[] = [
  { id: 'res-1', name: 'Etienne', apartmentId: 'apt-a', emoji: '🦊' },
  { id: 'res-2', name: 'Greta',   apartmentId: 'apt-a', emoji: '🐺' },
  { id: 'res-3', name: 'Marc',    apartmentId: 'apt-b', emoji: '🦋' },
  { id: 'res-4', name: 'Nele',    apartmentId: 'apt-b', emoji: '🐬' },
  { id: 'res-5', name: 'Dennis',  apartmentId: 'apt-c', emoji: '🦁' },
  { id: 'res-6', name: 'Charly',  apartmentId: 'apt-c', emoji: '🐸' },
]

export const CATEGORIES: Category[] = [
  { id: 'cat-reinigung', name: 'Reinigung',   icon: '🧹' },
  { id: 'cat-aussen',    name: 'Außenbereich', icon: '🌿' },
  { id: 'cat-muell',     name: 'Müll',         icon: '♻️' },
  { id: 'cat-sozial',    name: 'Gemeinschaft', icon: '🎉' },
]

// ─── ABFUHRTERMINE 2026 ───────────────────────────────────────────────────────

// Papiertonne: alle 4 Wochen (28 Tage) ab 04.05.2026
const PAPIERTONNE: string[] = [
  '2026-05-04', '2026-06-01', '2026-06-29', '2026-07-27',
  '2026-08-24', '2026-09-21', '2026-10-19', '2026-11-16', '2026-12-14',
]

// Graue Tonne: alle 2 Wochen ab 05.05., in Juli & August wöchentlich
const GRAUE_TONNE: string[] = [
  '2026-05-05', '2026-05-19',
  '2026-06-02', '2026-06-16', '2026-06-30',
  // Juli & August: wöchentlich
  '2026-07-07', '2026-07-14', '2026-07-21', '2026-07-28',
  '2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25',
  // ab September: wieder alle 2 Wochen
  '2026-09-08', '2026-09-22',
  '2026-10-06', '2026-10-20',
  '2026-11-03', '2026-11-17',
  '2026-12-01', '2026-12-15', '2026-12-29',
]

// Gelber Sack: alle 2 Wochen donnerstags.
// Ausnahme: 04.06. = Fronleichnam → verschoben auf 05.06. (Freitag)
const GELBER_SACK: string[] = [
  '2026-05-07', '2026-05-21',
  '2026-06-05', // Ausnahme: Fronleichnam 04.06. → 05.06.
  '2026-06-18',
  '2026-07-02', '2026-07-16', '2026-07-30',
  '2026-08-13', '2026-08-27',
  '2026-09-10', '2026-09-24',
  '2026-10-08', '2026-10-22',
  '2026-11-05', '2026-11-19',
  '2026-12-03', '2026-12-17', '2026-12-31',
]

// ─── AUFGABEN ─────────────────────────────────────────────────────────────────

export const TASKS: Task[] = [
  // Reinigung (innen)
  { id: 't-01', title: 'Treppenhaus saugen',              points: 20, categoryId: 'cat-reinigung', recurrenceDays: 14 },
  { id: 't-02', title: 'Hauseingangstreppe fegen',         points:  8, categoryId: 'cat-reinigung', recurrenceDays: 7  },
  { id: 't-03', title: 'Hauseingangbereich fegen',         points: 10, categoryId: 'cat-reinigung', recurrenceDays: 7  },
  { id: 't-04', title: 'Armaturen im Treppenhaus reinigen',points: 12, categoryId: 'cat-reinigung', recurrenceDays: 14 },
  { id: 't-05', title: 'Keller saugen',                    points: 15, categoryId: 'cat-reinigung', recurrenceDays: 30 },

  // Außenbereich
  { id: 't-06', title: 'Strasse fegen',          points: 15, categoryId: 'cat-aussen', recurrenceDays: 14 },
  { id: 't-07', title: 'Hinterer Bereich fegen', points: 10, categoryId: 'cat-aussen', recurrenceDays: 14 },
  { id: 't-08', title: 'Pflanzen entfernen',     points: 10, categoryId: 'cat-aussen', recurrenceDays: 14 },
  { id: 't-09', title: 'Grünschnitt wegbringen', points: 18, categoryId: 'cat-aussen', recurrenceDays: 30 },
  { id: 't-10', title: 'Schnee wegräumen',        points: 25, categoryId: 'cat-aussen', recurrenceDays: 1  },

  // Müll (Abfuhrtermine)
  {
    id: 't-11',
    title: 'Papiertonne rausstellen',
    points: 3,
    categoryId: 'cat-muell',
    scheduledDates: PAPIERTONNE,
  },
  {
    id: 't-12',
    title: 'Graue Tonne rausstellen',
    points: 3,
    categoryId: 'cat-muell',
    scheduledDates: GRAUE_TONNE,
  },
  {
    id: 't-13',
    title: 'Gelber Sack rausstellen',
    points: 3,
    categoryId: 'cat-muell',
    scheduledDates: GELBER_SACK,
  },

  // Müll reinholen
  {
    id: 't-16',
    title: 'Papiertonne reinholen',
    points: 2,
    categoryId: 'cat-muell',
    scheduledDates: PAPIERTONNE,
  },
  {
    id: 't-17',
    title: 'Graue Tonne reinholen',
    points: 2,
    categoryId: 'cat-muell',
    scheduledDates: GRAUE_TONNE,
  },
  {
    id: 't-18',
    title: 'Gelber Sack reinholen',
    points: 2,
    categoryId: 'cat-muell',
    scheduledDates: GELBER_SACK,
  },

  // Gemeinschaft (pro Person, unabhängig voneinander)
  {
    id: 't-14',
    title: 'Apéro organisieren',
    points: 20,
    categoryId: 'cat-sozial',
    description: 'Die anderen zu einem Apéro einladen',
    perResident: true,
    recurrenceDays: 14,
  },
  {
    id: 't-15',
    title: 'Abendessen organisieren',
    points: 30,
    categoryId: 'cat-sozial',
    description: 'Die anderen zum Abendessen einladen (30 Pkt. pro Person)',
    perResident: true,
    recurrenceDays: 30,
  },
]

// ─── LEVELS ───────────────────────────────────────────────────────────────────

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Anfänger', emoji: '🌱', minPoints: 0,    maxPoints: 99,   color: '#6B7280' },
  { level: 2, name: 'Fleißig',  emoji: '🔧', minPoints: 100,  maxPoints: 249,  color: '#3B82F6' },
  { level: 3, name: 'Solide',   emoji: '💪', minPoints: 250,  maxPoints: 499,  color: '#8B5CF6' },
  { level: 4, name: 'Profi',    emoji: '🏆', minPoints: 500,  maxPoints: 999,  color: '#F59E0B' },
  { level: 5, name: 'Legende',  emoji: '⭐', minPoints: 1000, maxPoints: null, color: '#EF4444' },
]

export function getLevelInfo(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i]
  }
  return LEVELS[0]
}

// Nächsten Abfuhrtermin für eine Aufgabe ermitteln
export function getNextScheduledDate(task: Task): Date | null {
  if (!task.scheduledDates) return null
  const now = Date.now()
  const upcoming = task.scheduledDates
    .map(d => new Date(d))
    .filter(d => d.getTime() >= now - 86400000) // ab gestern
    .sort((a, b) => a.getTime() - b.getTime())
  return upcoming[0] ?? null
}
