import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ApiKeyCard from '../components/ApiKeyCard'
import api from '../api/client'

function Alert({ type, msg }) {
  if (!msg) return null
  const isOk = type === 'success'
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
      isOk ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {isOk ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  )
}

export default function Settings() {
  const { token, name, email, updateName, logout } = useAuth()
  const navigate = useNavigate()

  // Profile form state
  const [newName, setNewName] = useState('')
  const [profileStatus, setProfileStatus] = useState({ type: '', msg: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwStatus, setPwStatus] = useState({ type: '', msg: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (!token) navigate('/', { replace: true })
    else setNewName(name || '')
  }, [token, navigate, name])

  async function handleProfileSave(e) {
    e.preventDefault()
    if (!newName.trim() || newName.trim().length < 2) {
      setProfileStatus({ type: 'error', msg: 'Name must be at least 2 characters.' })
      return
    }
    setSavingProfile(true)
    setProfileStatus({ type: '', msg: '' })
    try {
      const res = await api.patch('/v1/auth/profile', { name: newName.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      updateName(res.data.name)
      setProfileStatus({ type: 'success', msg: 'Name updated successfully.' })
    } catch (err) {
      setProfileStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to update profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      setPwStatus({ type: 'error', msg: 'New passwords do not match.' })
      return
    }
    if (newPw.length < 8) {
      setPwStatus({ type: 'error', msg: 'New password must be at least 8 characters.' })
      return
    }
    setSavingPw(true)
    setPwStatus({ type: '', msg: '' })
    try {
      await api.patch('/v1/auth/profile', { currentPassword: currentPw, newPassword: newPw }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPwStatus({ type: 'success', msg: 'Password changed. You may need to log in again on other devices.' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      setPwStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to change password.' })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your profile, password, and API key.</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Profile</h2>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your name"
                minLength={2}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={email || ''}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email changes are not supported yet.</p>
            </div>

            <Alert type={profileStatus.type} msg={profileStatus.msg} />

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {savingProfile && <Loader2 size={14} className="animate-spin" />}
              Save Name
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Lock size={18} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <Alert type={pwStatus.type} msg={pwStatus.msg} />

            <button
              type="submit"
              disabled={savingPw}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {savingPw && <Loader2 size={14} className="animate-spin" />}
              Change Password
            </button>
          </form>
        </div>

        {/* API Key Section */}
        <ApiKeyCard />

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="font-semibold text-red-700 mb-3">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Logging out will clear your session. Your account and API key will remain active.
          </p>
          <button
            onClick={logout}
            className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
