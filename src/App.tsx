import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useApp } from './context/AppContext'
import WelcomePage from './pages/WelcomePage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/AdminPage'
import Navigation from './components/Navigation'

function Guard({ children }: { children: React.ReactNode }) {
  const { currentResidentId } = useApp()
  return currentResidentId ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const { currentResidentId } = useApp()
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <Routes>
        <Route path="/"            element={<WelcomePage />} />
        <Route path="/dashboard"   element={<Guard><DashboardPage /></Guard>} />
        <Route path="/tasks"       element={<Guard><TasksPage /></Guard>} />
        <Route path="/leaderboard" element={<Guard><LeaderboardPage /></Guard>} />
        <Route path="/admin"       element={<AdminPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      {currentResidentId && !isAdmin && <Navigation />}
    </div>
  )
}
