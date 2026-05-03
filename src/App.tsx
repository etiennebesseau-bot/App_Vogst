import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import WelcomePage from './pages/WelcomePage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import LeaderboardPage from './pages/LeaderboardPage'
import Navigation from './components/Navigation'

function Guard({ children }: { children: React.ReactNode }) {
  const { currentResidentId } = useApp()
  return currentResidentId ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const { currentResidentId } = useApp()

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <Routes>
        <Route path="/"            element={<WelcomePage />} />
        <Route path="/dashboard"   element={<Guard><DashboardPage /></Guard>} />
        <Route path="/tasks"       element={<Guard><TasksPage /></Guard>} />
        <Route path="/leaderboard" element={<Guard><LeaderboardPage /></Guard>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      {currentResidentId && <Navigation />}
    </div>
  )
}
