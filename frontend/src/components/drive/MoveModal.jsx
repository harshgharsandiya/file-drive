import { useState, useEffect } from 'react'
import { HiOutlineFolder, HiOutlineChevronRight } from 'react-icons/hi'
import {
    getRootContents,
    getFolderChildren,
    moveFile,
    moveFolder,
} from '../../services/drive.service'
import toast from 'react-hot-toast'

export default function MoveModal({ item, currentFolderId, onClose }) {
    const [folders, setFolders] = useState([])
    const [selectedFolderId, setSelectedFolderId] = useState(null)
    const [path, setPath] = useState([]) // [{id, name}]
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchFolders(null)
    }, [])

    const fetchFolders = async (folderId) => {
        try {
            const { data } = folderId
                ? await getFolderChildren(folderId)
                : await getRootContents()

            // Exclude the item being moved (if it's a folder)
            const filtered = (data.data?.folders || []).filter(
                (f) => f._id !== item._id
            )
            setFolders(filtered)
        } catch (err) {
            toast.error('Failed to load folders')
        }
    }

    const navigateInto = (folder) => {
        setPath((prev) => [...prev, { id: folder._id, name: folder.name }])
        setSelectedFolderId(folder._id)
        fetchFolders(folder._id)
    }

    const navigateBack = (index) => {
        if (index === -1) {
            setPath([])
            setSelectedFolderId(null)
            fetchFolders(null)
        } else {
            const newPath = path.slice(0, index + 1)
            setPath(newPath)
            const folderId = newPath[newPath.length - 1].id
            setSelectedFolderId(folderId)
            fetchFolders(folderId)
        }
    }

    const handleMove = async () => {
        setLoading(true)
        try {
            if (item.itemType === 'folder') {
                await moveFolder(item._id, selectedFolderId)
            } else {
                await moveFile(item._id, selectedFolderId)
            }
            toast.success('Moved successfully')
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to move')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Move "{item.name}"
                </h2>

                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 flex-wrap">
                    <button
                        onClick={() => navigateBack(-1)}
                        className="hover:text-blue-600 cursor-pointer"
                    >
                        My Drive
                    </button>
                    {path.map((p, i) => (
                        <span key={p.id} className="flex items-center gap-1">
                            <HiOutlineChevronRight className="w-3 h-3" />
                            <button
                                onClick={() => navigateBack(i)}
                                className="hover:text-blue-600 cursor-pointer"
                            >
                                {p.name}
                            </button>
                        </span>
                    ))}
                </div>

                {/* Folder list */}
                <div className="border border-gray-200 rounded-lg max-h-60 overflow-auto mb-4">
                    {folders.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                            No subfolders
                        </p>
                    ) : (
                        folders.map((folder) => (
                            <button
                                key={folder._id}
                                onClick={() => navigateInto(folder)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition cursor-pointer border-b border-gray-100 last:border-0"
                            >
                                <HiOutlineFolder className="w-5 h-5 text-blue-500 shrink-0" />
                                <span className="text-sm text-gray-700 truncate">
                                    {folder.name}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {loading ? 'Moving...' : 'Move here'}
                    </button>
                </div>
            </div>
        </div>
    )
}
