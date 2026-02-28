import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { HiOutlineClock } from 'react-icons/hi'
import { getActivities } from '../../services/drive.service'
import toast from 'react-hot-toast'

const actionLabels = {
    upload: 'Uploaded',
    download: 'Downloaded',
    rename: 'Renamed',
    move: 'Moved',
    delete: 'Deleted',
    restore: 'Restored',
    share: 'Shared',
    preview: 'Previewed',
    version: 'New version',
    create: 'Created',
}

const actionColors = {
    upload: 'bg-green-100 text-green-700',
    download: 'bg-blue-100 text-blue-700',
    rename: 'bg-yellow-100 text-yellow-700',
    move: 'bg-purple-100 text-purple-700',
    delete: 'bg-red-100 text-red-700',
    restore: 'bg-emerald-100 text-emerald-700',
    share: 'bg-indigo-100 text-indigo-700',
    preview: 'bg-gray-100 text-gray-700',
    version: 'bg-orange-100 text-orange-700',
    create: 'bg-teal-100 text-teal-700',
}

export default function Activity() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        fetchActivities()
    }, [page])

    const fetchActivities = async () => {
        setLoading(true)
        try {
            const { data } = await getActivities({ page, limit: 30 })
            setActivities(data.data || [])
            setPagination(data.pagination)
        } catch (err) {
            toast.error('Failed to load activity')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity</h1>

            {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineClock className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No activity yet</p>
                    <p className="text-sm mt-1">
                        Your file and folder actions will appear here
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {activities.map((activity) => (
                            <div
                                key={activity._id}
                                className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4"
                            >
                                <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${
                                        actionColors[activity.action] ||
                                        'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {actionLabels[activity.action] ||
                                        activity.action}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700">
                                        <span className="capitalize">
                                            {activity.itemType}
                                        </span>
                                        {activity.metadata?.name && (
                                            <span className="font-medium">
                                                {' '}
                                                {activity.metadata.name}
                                            </span>
                                        )}
                                        {activity.metadata?.oldName && (
                                            <span>
                                                {' '}
                                                from "
                                                {activity.metadata.oldName}" to
                                                "{activity.metadata.newName}"
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatDistanceToNow(
                                            new Date(activity.createdAt),
                                            {
                                                addSuffix: true,
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
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
                </>
            )}
        </div>
    )
}
