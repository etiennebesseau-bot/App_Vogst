import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const ITEMS = [
  { to: '/dashboard',   icon: '🏠', label: 'Start'      },
  { to: '/tasks',       icon: '✅', label: 'Aufgaben'   },
  { to: '/leaderboard', icon: '🏆', label: 'Rangliste'  },
]

export default function Navigation() {
  const { currentApartment } = useApp()
  const accentColor = currentApartment?.color ?? '#7C3AED'

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex">
        {ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-semibold" style={isActive ? { color: accentColor } : {}}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: accentColor }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
