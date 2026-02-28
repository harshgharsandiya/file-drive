import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineShare } from 'react-icons/hi'
import { getSharedWithMe } from '../../services/drive.service'
import { FolderIcon, FileIcon, formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function SharedWithMe() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchShared()
    }, [])

    const fetchShared = async () => {
        try {
            const { data } = await getSharedWithMe()
            setItems(data.data || [])
        } catch (err) {
            toast.error('Failed to load shared items')
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Shared with me
            </h1>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <HiOutlineShare className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">
                        Nothing shared with you
                    </p>
                    <p className="text-sm mt-1">
                        Items shared with you will appear here
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 hidden sm:table-cell">
                                    Shared by
                                </th>
                                <th className="px-4 py-3 hidden md:table-cell">
                                    Permission
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(({ share, item }) => (
                                <tr
                                    key={share._id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                        if (share.itemType === 'folder') {
                                            navigate(`/folder/${item._id}`)
                                        }
                                    }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {share.itemType === 'folder' ? (
                                                <FolderIcon className="w-5 h-5 shrink-0" />
                                            ) : (
                                                <FileIcon
                                                    type={item.type}
                                                    className="w-5 h-5 shrink-0"
                                                />
                                            )}
                                            <span className="text-sm text-gray-700">
                                                {item.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <span className="text-sm text-gray-500">
                                            {share.ownerId?.name ||
                                                share.ownerId?.email ||
                                                '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                                            {share.permission}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
