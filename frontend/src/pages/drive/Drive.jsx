import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    HiOutlinePlus,
    HiOutlineUpload,
    HiOutlineChevronRight,
    HiOutlineHome,
} from 'react-icons/hi'

import {
    getRootContents,
    getFolderChildren,
    createFolder,
    deleteFolder,
    deleteFile,
    uploadFile,
    downloadFile,
    getFolderPath,
    toggleFileStar,
    toggleFolderStar,
    duplicateFile,
    duplicateFolder,
} from '../../services/drive.service'

import FileList from '../../components/drive/FileList'
import NewFolderModal from '../../components/drive/NewFolderModal'
import UploadProgress from '../../components/drive/UploadProgress'
import ContextMenu from '../../components/drive/ContextMenu'
import PreviewModal from '../../components/drive/PreviewModal'
import ShareModal from '../../components/drive/ShareModal'
import RenameModal from '../../components/drive/RenameModal'
import MoveModal from '../../components/drive/MoveModal'

export default function Drive() {
    const { folderId } = useParams()
    const navigate = useNavigate()

    const [folders, setFolders] = useState([])
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [breadcrumbs, setBreadcrumbs] = useState([])

    // Modals
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [uploads, setUploads] = useState([])
    const [contextMenu, setContextMenu] = useState(null)
    const [previewItem, setPreviewItem] = useState(null)
    const [shareItem, setShareItem] = useState(null)
    const [renameItem, setRenameItem] = useState(null)
    const [moveItem, setMoveItem] = useState(null)

    const fetchContents = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = folderId
                ? await getFolderChildren(folderId)
                : await getRootContents()
            setFolders(data.data?.folders || [])
            setFiles(data.data?.files || [])
        } catch (err) {
            toast.error('Failed to load contents')
        } finally {
            setLoading(false)
        }
    }, [folderId])

    useEffect(() => {
        fetchContents()
    }, [fetchContents])

    // Build breadcrumbs from API
    useEffect(() => {
        if (!folderId) {
            setBreadcrumbs([])
            return
        }
        const fetchBreadcrumbs = async () => {
            try {
                const { data } = await getFolderPath(folderId)
                const path = data.data || []
                setBreadcrumbs(path.map((f) => ({ id: f._id, name: f.name })))
            } catch {
                setBreadcrumbs([])
            }
        }
        fetchBreadcrumbs()
    }, [folderId])

    const navigateToFolder = (folder) => {
        navigate(`/folder/${folder._id}`)
    }

    const handleCreateFolder = async (name) => {
        try {
            await createFolder({ name, parentId: folderId || null })
            toast.success('Folder created')
            setShowNewFolder(false)
            fetchContents()
        } catch (err) {
            toast.error(
                err.response?.data?.message || 'Failed to create folder'
            )
        }
    }

    const handleDownload = async (file) => {
        try {
            const { data } = await downloadFile(file._id)
            window.open(data.data.downloadUrl, '_blank')
        } catch (err) {
            toast.error('Download failed')
        }
    }

    const handleUpload = async (fileList) => {
        const filesToUpload = Array.from(fileList)

        for (const file of filesToUpload) {
            const uploadId = Date.now() + Math.random()
            setUploads((prev) => [
                ...prev,
                { id: uploadId, name: file.name, progress: 0 },
            ])

            const formData = new FormData()
            formData.append('file', file)
            if (folderId) formData.append('folderId', folderId)

            try {
                await uploadFile(formData, (e) => {
                    const progress = Math.round((e.loaded / e.total) * 100)
                    setUploads((prev) =>
                        prev.map((u) =>
                            u.id === uploadId ? { ...u, progress } : u
                        )
                    )
                })
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === uploadId
                            ? { ...u, progress: 100, done: true }
                            : u
                    )
                )
            } catch (err) {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === uploadId ? { ...u, error: true } : u
                    )
                )
                toast.error(`Failed to upload ${file.name}`)
            }
        }
        fetchContents()
    }

    const handleDelete = async (item, type) => {
        if (!confirm(`Delete "${item.name}"?`)) return
        try {
            if (type === 'folder') {
                await deleteFolder(item._id)
            } else {
                await deleteFile(item._id)
            }
            toast.success('Moved to trash')
            fetchContents()
        } catch (err) {
            toast.error('Failed to delete')
        }
    }

    const handleStar = async (item, type) => {
        try {
            if (type === 'folder') {
                await toggleFolderStar(item._id)
            } else {
                await toggleFileStar(item._id)
            }
            toast.success(item.isStarred ? 'Unstarred' : 'Starred')
            fetchContents()
        } catch (err) {
            toast.error('Failed to update star')
        }
    }

    const handleDuplicate = async (item, type) => {
        try {
            if (type === 'folder') {
                await duplicateFolder(item._id)
            } else {
                await duplicateFile(item._id)
            }
            toast.success('Duplicated')
            fetchContents()
        } catch (err) {
            toast.error('Failed to duplicate')
        }
    }

    const handleContextAction = (action, item, type) => {
        setContextMenu(null)
        switch (action) {
            case 'open':
                if (type === 'folder') navigateToFolder(item)
                else setPreviewItem(item)
                break
            case 'preview':
                setPreviewItem(item)
                break
            case 'download':
                handleDownload(item)
                break
            case 'share':
                setShareItem({ ...item, itemType: type })
                break
            case 'rename':
                setRenameItem({ ...item, itemType: type })
                break
            case 'move':
                setMoveItem({ ...item, itemType: type })
                break
            case 'star':
                handleStar(item, type)
                break
            case 'duplicate':
                handleDuplicate(item, type)
                break
            case 'delete':
                handleDelete(item, type)
                break
        }
    }

    const clearDoneUploads = () => {
        setUploads((prev) => prev.filter((u) => !u.done && !u.error))
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer"
                        >
                            <HiOutlineHome className="w-4 h-4" />
                            My Drive
                        </button>
                        {breadcrumbs.map((crumb) => (
                            <span
                                key={crumb.id}
                                className="flex items-center gap-1"
                            >
                                <HiOutlineChevronRight className="w-4 h-4" />
                                <button
                                    onClick={() =>
                                        navigate(`/folder/${crumb.id}`)
                                    }
                                    className="hover:text-blue-600 transition cursor-pointer"
                                >
                                    {crumb.name}
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-sm font-medium">
                        <HiOutlineUpload className="w-4 h-4" />
                        Upload
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files)}
                        />
                    </label>
                    <button
                        onClick={() => setShowNewFolder(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        New Folder
                    </button>
                </div>
            </div>

            {/* Upload progress */}
            {uploads.length > 0 && (
                <UploadProgress uploads={uploads} onClear={clearDoneUploads} />
            )}

            {/* File and folder list */}
            <FileList
                folders={folders}
                files={files}
                loading={loading}
                onFolderClick={navigateToFolder}
                onFileClick={(file) => setPreviewItem(file)}
                onContextMenu={(e, item, type) => {
                    e.preventDefault()
                    setContextMenu({ x: e.clientX, y: e.clientY, item, type })
                }}
                onAction={handleContextAction}
            />

            {/* Modals */}
            {showNewFolder && (
                <NewFolderModal
                    onSubmit={handleCreateFolder}
                    onClose={() => setShowNewFolder(false)}
                />
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    item={contextMenu.item}
                    type={contextMenu.type}
                    onAction={handleContextAction}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {previewItem && (
                <PreviewModal
                    file={previewItem}
                    onClose={() => setPreviewItem(null)}
                    onAction={handleContextAction}
                />
            )}

            {shareItem && (
                <ShareModal
                    item={shareItem}
                    onClose={() => {
                        setShareItem(null)
                        fetchContents()
                    }}
                />
            )}

            {renameItem && (
                <RenameModal
                    item={renameItem}
                    onClose={() => {
                        setRenameItem(null)
                        fetchContents()
                    }}
                />
            )}

            {moveItem && (
                <MoveModal
                    item={moveItem}
                    currentFolderId={folderId || null}
                    onClose={() => {
                        setMoveItem(null)
                        fetchContents()
                    }}
                />
            )}
        </div>
    )
}
