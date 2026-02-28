import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { HiOutlineSearch } from 'react-icons/hi'

import { search } from '../../services/drive.service'
import { FolderIcon, FileIcon, formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function Search() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const query = searchParams.get('q') || ''

    const [results, setResults] = useState({ files: [], folders: [] })
    const [loading, setLoading] = useState(false)
    const [typeFilter, setTypeFilter] = useState('')

    useEffect(() => {
        if (query) {
            performSearch()
        }
    }, [query, typeFilter])

    const performSearch = async () => {
        setLoading(true)
        try {
            const params = { q: query }
            if (typeFilter) params.type = typeFilter
            const { data } = await search(params)
            setResults(data.data || { files: [], folders: [] })
        } catch (err) {
            toast.error('Search failed')
        } finally {
            setLoading(false)
        }
    }

    const totalResults =
        (results.files?.length || 0) + (results.folders?.length || 0)

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Search Results
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {loading
                            ? 'Searching...'
                            : `${totalResults} results for "${query}"`}
                    </p>
                </div>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All types</option>
                    <option value="pdf">PDF</option>
                    <option value="jpg">Images</option>
                    <option value="mp4">Videos</option>
                    <option value="doc">Documents</option>
                    <option value="txt">Text</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : totalResults === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineSearch className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm mt-1">Try different keywords</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Folders */}
                    {results.folders?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">
                                Folders
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {results.folders.map((folder) => (
                                    <div
                                        key={folder._id}
                                        onClick={() =>
                                            navigate(`/folder/${folder._id}`)
                                        }
                                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition"
                                    >
                                        <FolderIcon className="w-6 h-6 shrink-0" />
                                        <span className="text-sm font-medium text-gray-700 truncate">
                                            {folder.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {results.files?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">
                                Files
                            </h3>
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {results.files.map((file) => (
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
                                                              new Date(
                                                                  file.updatedAt
                                                              ),
                                                              'MMM d, yyyy'
                                                          )
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
