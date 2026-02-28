import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { HiOutlineClock } from 'react-icons/hi'
import { getRecentFiles, downloadFile } from '../../services/drive.service'
import { FileIcon, formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function Recent() {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        fetchRecent()
    }, [page])

    const fetchRecent = async () => {
        setLoading(true)
        try {
            const { data } = await getRecentFiles({ page, limit: 50 })
            setFiles(data.data || [])
            setPagination(data.pagination)
        } catch (err) {
            toast.error('Failed to load recent files')
        } finally {
            setLoading(false)
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Recent</h1>

            {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineClock className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No recent files</p>
                    <p className="text-sm mt-1">
                        Files you recently accessed will appear here
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
                                <tr key={file._id} className="hover:bg-gray-50">
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
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                        >
                                            Download
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
