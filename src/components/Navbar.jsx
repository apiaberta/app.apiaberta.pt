import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, BookOpen, LayoutDashboard, Zap, UserPlus } from 'lucide-react'

export default function Navbar() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav style={{ backgroundColor: '#0F172A' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={token ? '/dashboard' : '/'} className="flex items-center gap-2 no-underline">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#16A34A' }}
            >
              <Zap size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              API Aberta
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full ml-1"
              style={{ backgroundColor: '#16A34A20', color: '#4ADE80' }}
            >
              dev portal
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {token && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors no-underline"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            )}
            <Link
              to="/docs"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors no-underline"
            >
              <BookOpen size={15} />
              Docs
            </Link>
            {!token && (
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors no-underline"
              >
                <UserPlus size={15} />
                Register
              </Link>
            )}
            {token && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer border-0 bg-transparent ml-2"
              >
                <LogOut size={15} />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
