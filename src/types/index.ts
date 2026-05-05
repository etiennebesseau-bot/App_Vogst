export interface Apartment {
  id: string
  name: string
  color: string
  bgColor: string
  borderColor: string
  emoji: string
}

export interface Resident {
  id: string
  name: string
  apartmentId: string
  emoji: string
}

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Task {
  id: string
  title: string
  points: number
  categoryId: string
  description?: string
  // Standard recurrence (global: once done by anyone, blocks everyone for X days)
  recurrenceDays?: number
  // Specific collection dates (waste tasks)
  scheduledDates?: string[]
  // Per-resident recurrence (social tasks: each person tracks independently)
  perResident?: boolean
}

export interface TaskCompletion {
  id: string
  taskId: string
  residentId: string
  completedAt: string
  pointsEarned: number
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: string[]
  createdAt: string
}

export interface Kudos {
  id: string
  fromResidentId: string
  toResidentId: string
  createdAt: string
}

export interface LevelInfo {
  level: number
  name: string
  emoji: string
  minPoints: number
  maxPoints: number | null
  color: string
}
