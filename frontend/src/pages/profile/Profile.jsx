import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    getStorageBreakdown,
    deleteDrive,
} from '../../services/drive.service'
import { formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user, loginUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [storage, setStorage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)

    // Password change
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [changingPassword, setChangingPassword] = useState(false)

    // Delete drive modal state
    const [deleteDriveStep, setDeleteDriveStep] = useState(0) // 0=closed, 1=warn, 2=confirm
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deletingDrive, setDeletingDrive] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [profileRes, storageRes] = await Promise.all([
                getProfile(),
                getStorageBreakdown(),
            ])
            const profileData = profileRes.data.data
            setProfile(profileData)
            setName(profileData.name || '')
            setStorage(storageRes.data.data)
        } catch (err) {
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        if (!name.trim()) return
        setSaving(true)
        try {
            const { data } = await updateProfile({ name: name.trim() })
            setProfile(data.data)
            // Update local auth context
            const token = localStorage.getItem('token')
            if (token) {
                loginUser(token, { ...user, name: name.trim() })
            }
            toast.success('Profile updated')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update')
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const formData = new FormData()
        formData.append('avatar', file)
        try {
            const { data } = await uploadAvatar(formData)
            setProfile((prev) => ({ ...prev, avatarUrl: data.data.avatarUrl }))
            toast.success('Avatar updated')
        } catch (err) {
            toast.error('Failed to upload avatar')
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (passwords.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        setChangingPassword(true)
        try {
            await changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            })
            toast.success('Password changed')
            setPasswords({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Failed to change password'
            )
        } finally {
            setChangingPassword(false)
        }
    }

    const handleDeleteDrive = async () => {
        if (deleteConfirmText !== 'DELETE') return
        setDeletingDrive(true)
        try {
            await deleteDrive()
            toast.success('All files and folders have been deleted')
            setDeleteDriveStep(0)
            setDeleteConfirmText('')
            // Refresh storage info
            const storageRes = await getStorageBreakdown()
            setStorage(storageRes.data.data)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete drive')
        } finally {
            setDeletingDrive(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const storagePercent = storage
        ? Math.min(100, (storage.storageUsed / storage.storageLimit) * 100)
        : 0

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

            {/* Avatar & Name */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        {profile?.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt="Avatar"
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-bold text-2xl">
                                    {profile?.name?.charAt(0)?.toUpperCase() ||
                                        'U'}
                                </span>
                            </div>
                        )}
                        <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs cursor-pointer hover:bg-blue-700 transition">
                            +
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </label>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {profile?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                            {profile?.email}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Storage Usage */}
            {storage && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Storage Usage
                    </h2>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>
                            {formatFileSize(storage.storageUsed ?? 0)} of{' '}
                            {formatFileSize(storage.storageLimit)} used
                        </span>
                        <span>{storagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div
                            className={`h-2.5 rounded-full transition-all ${
                                storagePercent > 90
                                    ? 'bg-red-500'
                                    : storagePercent > 70
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-600'
                            }`}
                            style={{ width: `${storagePercent}%` }}
                        />
                    </div>

                    {/* Breakdown */}
                    {storage.categories && (
                        <div className="space-y-2 mt-2">
                            {Object.entries(storage.categories)
                                .filter(([, size]) => size > 0)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, size]) => (
                                    <div
                                        key={cat}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-gray-600 capitalize">
                                            {cat}
                                        </span>
                                        <span className="text-gray-500">
                                            {formatFileSize(size)}
                                            {storage.counts?.[cat]
                                                ? ` (${storage.counts[cat]} files)`
                                                : ''}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Change Password */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Change Password
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={passwords.currentPassword}
                            onChange={(e) =>
                                setPasswords({
                                    ...passwords,
                                    currentPassword: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={passwords.newPassword}
                            onChange={(e) =>
                                setPasswords({
                                    ...passwords,
                                    newPassword: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(e) =>
                                setPasswords({
                                    ...passwords,
                                    confirmPassword: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={changingPassword}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Danger Zone — Delete Drive */}
            <div className="bg-white border border-red-200 rounded-xl p-6 mt-6">
                <h2 className="text-lg font-semibold text-red-700 mb-1">
                    Danger Zone
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Permanently delete all your files and folders. This cannot
                    be undone.
                </p>
                <button
                    onClick={() => setDeleteDriveStep(1)}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                >
                    Delete Entire Drive
                </button>
            </div>

            {/* Delete Drive Modal — Step 1: Warning */}
            {deleteDriveStep === 1 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => setDeleteDriveStep(0)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <span className="text-red-600 text-xl">⚠️</span>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Delete Entire Drive?
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            This will permanently delete{' '}
                            <strong>all your files and folders</strong>. This
                            action <strong>cannot be undone</strong> and your
                            storage will be reset to 0.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteDriveStep(0)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setDeleteDriveStep(2)}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Drive Modal — Step 2: Type DELETE */}
            {deleteDriveStep === 2 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={() => {
                        setDeleteDriveStep(0)
                        setDeleteConfirmText('')
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            Confirm Deletion
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Type <strong>DELETE</strong> to confirm you want to
                            wipe your entire drive.
                        </p>
                        <input
                            type="text"
                            autoFocus
                            value={deleteConfirmText}
                            onChange={(e) =>
                                setDeleteConfirmText(e.target.value)
                            }
                            placeholder="Type DELETE"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-5"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setDeleteDriveStep(0)
                                    setDeleteConfirmText('')
                                }}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteDrive}
                                disabled={
                                    deleteConfirmText !== 'DELETE' ||
                                    deletingDrive
                                }
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                                {deletingDrive
                                    ? 'Deleting...'
                                    : 'Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
