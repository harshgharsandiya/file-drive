import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { HiOutlineBell, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi'
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
} from '../../services/drive.service'
import toast from 'react-hot-toast'

const typeIcons = {
    file_shared: '📤',
    storage_warning: '⚠️',
    file_comment: '💬',
    link_accessed: '🔗',
}

export default function Notifications() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        fetchNotifications()
    }, [page])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const { data } = await getNotifications({ page, limit: 30 })
            setNotifications(data.data || [])
            setPagination(data.pagination)
        } catch (err) {
            toast.error('Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id)
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            )
        } catch {
            toast.error('Failed to mark as read')
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead()
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            toast.success('All marked as read')
        } catch {
            toast.error('Failed to mark all as read')
        }
    }

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id)
            setNotifications((prev) => prev.filter((n) => n._id !== id))
            toast.success('Notification deleted')
        } catch {
            toast.error('Failed to delete')
        }
    }

    const hasUnread = notifications.some((n) => !n.read)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Notifications
                </h1>
                {hasUnread && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                    >
                        <HiOutlineCheck className="w-4 h-4" />
                        Mark all read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineBell className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm mt-1">You&apos;re all caught up!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition ${
                                notif.read
                                    ? 'bg-white border-gray-200'
                                    : 'bg-blue-50 border-blue-200'
                            }`}
                        >
                            <span className="text-xl shrink-0">
                                {typeIcons[notif.type] || '🔔'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700">
                                    {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(
                                        new Date(notif.createdAt),
                                        { addSuffix: true }
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {!notif.read && (
                                    <button
                                        onClick={() =>
                                            handleMarkRead(notif._id)
                                        }
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                                        title="Mark as read"
                                    >
                                        <HiOutlineCheck className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(notif._id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="Delete"
                                >
                                    <HiOutlineTrash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= pagination.pages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
