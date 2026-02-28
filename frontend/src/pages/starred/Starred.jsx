import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { HiOutlineStar } from 'react-icons/hi'
import {
    getStarredFiles,
    toggleFileStar,
    toggleFolderStar,
    downloadFile,
} from '../../services/drive.service'
import { FolderIcon, FileIcon, formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function Starred() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchStarred()
    }, [page])

    const fetchStarred = async () => {
        setLoading(true)
        try {
            const { data } = await getStarredFiles({ page, limit: 50 })
            setFiles(data.data || [])
            setPagination(data.pagination)
        } catch (err) {
            toast.error('Failed to load starred files')
        } finally {
            setLoading(false)
        }
    }

    const handleUnstar = async (file) => {
        try {
            await toggleFileStar(file._id)
            toast.success('Unstarred')
            fetchStarred()
        } catch {
            toast.error('Failed to unstar')
        }
    }

    const handleDownload = async (file) => {
        try {
            const { data } = await downloadFile(file._id)
            window.open(data.data.downloadUrl, '_blank')
        } catch {
            toast.error('Download failed')
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Starred</h1>

            {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineStar className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No starred files</p>
                    <p className="text-sm mt-1">
                        Star files to find them quickly here
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 hidden sm:table-cell">
                                    Size
                                </th>
                                <th className="px-4 py-3 hidden md:table-cell">
                                    Modified
                                </th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {files.map((file) => (
                                <tr
                                    key={file._id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <FileIcon
                                                type={file.type}
                                                className="w-5 h-5 shrink-0"
                                            />
                                            <span className="text-sm text-gray-700 truncate">
                                                {file.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">
                                        {formatFileSize(file.size)}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500">
                                        {file.updatedAt
                                            ? format(
                                                  new Date(file.updatedAt),
                                                  'MMM d, yyyy'
                                              )
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() =>
                                                    handleDownload(file)
                                                }
                                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                            >
                                                Download
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleUnstar(file)
                                                }
                                                className="p-2 text-yellow-500 hover:text-gray-400 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                                                title="Unstar"
                                            >
                                                <HiOutlineStar className="w-4 h-4 fill-current" />
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
