import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, CheckCircle, AlertCircle, Loader2, Trash2, X } from 'lucide-react'
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

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete('/v1/auth/account', {
        headers: { Authorization: `Bearer ${token}` }
      })
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account.')
      setDeleting(false)
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
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <h2 className="font-semibold text-red-700 mb-4">Danger Zone</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Log out</p>
                <p className="text-xs text-gray-500">Clear your session. Account remains active.</p>
              </div>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div>
                <p className="text-sm font-medium text-red-900">Delete account</p>
                <p className="text-xs text-red-700">Account will be deleted after 30 days. Log in to cancel.</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 bg-white px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center text-xs text-gray-400 space-x-4">
          <a href="https://apiaberta.pt/termos" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
            Termos de Uso
          </a>
          <a href="https://apiaberta.pt/privacidade" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
            Política de Privacidade
          </a>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Your account will be scheduled for deletion in 30 days. 
                  During this period, you can cancel by logging in. After 30 days, all your data 
                  will be permanently deleted.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE"
                />
              </div>

              {deleteError && (
                <p className="text-sm text-red-600">{deleteError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(''); }}
                  className="flex-1 text-sm font-medium text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
