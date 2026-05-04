import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, BookOpen, LayoutDashboard, Zap, UserPlus, Shield, Webhook, Terminal, Settings, Menu, X, DollarSign, UserCheck } from 'lucide-react'

export default function Navbar() {
  const { token, tier, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  function closeMenu() {
    setMobileOpen(false)
  }

  const NavLink = ({ to, icon: Icon, children, className = '' }) => (
    <Link
      to={to}
      onClick={closeMenu}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors no-underline ${className}`}
    >
      <Icon size={15} />
      {children}
    </Link>
  )

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
              className="text-xs font-medium px-2 py-0.5 rounded-full ml-1 hidden sm:inline"
              style={{ backgroundColor: '#16A34A20', color: '#4ADE80' }}
            >
              dev portal
            </span>
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {token && <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>}
            {token && <NavLink to="/playground" icon={Terminal}>Playground</NavLink>}
            {token && <NavLink to="/webhooks" icon={Webhook}>Webhooks</NavLink>}
            <NavLink to="/explore/currency" icon={DollarSign}>Currency</NavLink>
            <NavLink to="/explore/nif" icon={UserCheck}>NIF</NavLink>
            {token && tier === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-violet-300 hover:text-white hover:bg-violet-800/40 transition-colors no-underline"
              >
                <Shield size={15} />
                Admin
              </Link>
            )}
            <NavLink to="/docs" icon={BookOpen}>Docs</NavLink>
            {!token && <NavLink to="/register" icon={UserPlus}>Register</NavLink>}
            {token && <NavLink to="/settings" icon={Settings}>Settings</NavLink>}
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer border-0 bg-transparent"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-700" style={{ backgroundColor: '#0F172A' }}>
          <div className="px-4 py-3 space-y-1">
            {token && <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>}
            {token && <NavLink to="/playground" icon={Terminal}>Playground</NavLink>}
            {token && <NavLink to="/webhooks" icon={Webhook}>Webhooks</NavLink>}
            <NavLink to="/explore/currency" icon={DollarSign}>Currency</NavLink>
            <NavLink to="/explore/nif" icon={UserCheck}>NIF</NavLink>
            {token && tier === 'admin' && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-violet-300 hover:text-white hover:bg-violet-800/40 transition-colors no-underline"
              >
                <Shield size={15} />
                Admin
              </Link>
            )}
            <NavLink to="/docs" icon={BookOpen}>Docs</NavLink>
            {!token && <NavLink to="/register" icon={UserPlus}>Register</NavLink>}
            {token && <NavLink to="/settings" icon={Settings}>Settings</NavLink>}
            {token && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer border-0 bg-transparent w-full text-left"
              >
                <LogOut size={15} />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
