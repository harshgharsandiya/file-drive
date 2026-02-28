import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { HiOutlineRefresh, HiOutlineTrash } from 'react-icons/hi'
import {
    getTrash,
    restoreFromTrash,
    permanentDelete,
    emptyTrash,
} from '../../services/drive.service'
import { FolderIcon, FileIcon } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function Trash() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        fetchTrash()
    }, [page])

    const fetchTrash = async () => {
        setLoading(true)
        try {
            const { data } = await getTrash({ page, limit: 50 })
            setItems(data.data || [])
            setPagination(data.pagination)
        } catch (err) {
            toast.error('Failed to load trash')
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (trashId) => {
        try {
            await restoreFromTrash(trashId)
            toast.success('Restored')
            fetchTrash()
        } catch (err) {
            toast.error('Failed to restore')
        }
    }

    const handlePermanentDelete = async (trashId) => {
        if (!confirm('Permanently delete? This cannot be undone.')) return
        try {
            await permanentDelete(trashId)
            toast.success('Permanently deleted')
            fetchTrash()
        } catch (err) {
            toast.error('Failed to delete')
        }
    }

    const handleEmptyTrash = async () => {
        if (!confirm('Empty trash? All items will be permanently deleted.'))
            return
        try {
            await emptyTrash()
            toast.success('Trash emptied')
            setItems([])
        } catch (err) {
            toast.error('Failed to empty trash')
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
                {items.length > 0 && (
                    <button
                        onClick={handleEmptyTrash}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                        <HiOutlineTrash className="w-4 h-4" />
                        Empty Trash
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineTrash className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Trash is empty</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 hidden sm:table-cell">
                                    Type
                                </th>
                                <th className="px-4 py-3 hidden md:table-cell">
                                    Deleted
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr
                                    key={item.trashId}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {item.itemType === 'folder' ? (
                                                <FolderIcon className="w-5 h-5 shrink-0" />
                                            ) : (
                                                <FileIcon
                                                    type=""
                                                    className="w-5 h-5 shrink-0"
                                                />
                                            )}
                                            <span className="text-sm text-gray-700 truncate">
                                                {item.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <span className="text-sm text-gray-500 capitalize">
                                            {item.itemType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="text-sm text-gray-500">
                                            {item.deletedAt
                                                ? format(
                                                      new Date(item.deletedAt),
                                                      'MMM d, yyyy'
                                                  )
                                                : '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() =>
                                                    handleRestore(item.trashId)
                                                }
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
                                                title="Restore"
                                            >
                                                <HiOutlineRefresh className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handlePermanentDelete(
                                                        item.trashId
                                                    )
                                                }
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                title="Delete permanently"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
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
