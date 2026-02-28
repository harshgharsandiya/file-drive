import { useState, useEffect } from 'react'
import { HiOutlineShare, HiOutlineTrash } from 'react-icons/hi'
import { getSharedByMe, revokeShare } from '../../services/drive.service'
import { FolderIcon, FileIcon } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function SharedByMe() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        fetchShared()
    }, [page])

    const fetchShared = async () => {
        setLoading(true)
        try {
            const { data } = await getSharedByMe({ page, limit: 50 })
            setItems(data.data || [])
            setPagination(data.pagination)
        } catch (err) {
            toast.error('Failed to load shared items')
        } finally {
            setLoading(false)
        }
    }

    const handleRevoke = async (shareId) => {
        if (!confirm('Remove this share?')) return
        try {
            await revokeShare(shareId)
            toast.success('Share removed')
            fetchShared()
        } catch {
            toast.error('Failed to remove share')
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Shared by me
            </h1>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineShare className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">
                        You haven&apos;t shared anything
                    </p>
                    <p className="text-sm mt-1">
                        Items you share will appear here
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 hidden sm:table-cell">
                                    Shared with
                                </th>
                                <th className="px-4 py-3 hidden md:table-cell">
                                    Permission
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(({ share, item }) => (
                                <tr
                                    key={share._id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {share.itemType === 'folder' ? (
                                                <FolderIcon className="w-5 h-5 shrink-0" />
                                            ) : (
                                                <FileIcon
                                                    type={item?.type}
                                                    className="w-5 h-5 shrink-0"
                                                />
                                            )}
                                            <span className="text-sm text-gray-700">
                                                {item?.name || 'Deleted item'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <span className="text-sm text-gray-500">
                                            {share.sharedWith?.email ||
                                                (share.linkToken
                                                    ? 'Public link'
                                                    : '—')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                            {share.permission}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() =>
                                                handleRevoke(share._id)
                                            }
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                            title="Remove share"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
