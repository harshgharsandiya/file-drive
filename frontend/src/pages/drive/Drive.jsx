import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    HiOutlinePlus,
    HiOutlineUpload,
    HiOutlineChevronRight,
    HiOutlineHome,
    HiOutlineTrash,
    HiOutlineX,
    HiOutlineCollection,
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
    getStorageBreakdown,
} from '../../services/drive.service'

import FileList from '../../components/drive/FileList'
import NewFolderModal from '../../components/drive/NewFolderModal'
import UploadProgress from '../../components/drive/UploadProgress'
import ContextMenu from '../../components/drive/ContextMenu'
import PreviewModal from '../../components/drive/PreviewModal'
import ShareModal from '../../components/drive/ShareModal'
import MoveModal from '../../components/drive/MoveModal'

export default function Drive() {
    const { folderId } = useParams()
    const navigate = useNavigate()

    const [folders, setFolders] = useState([])
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [breadcrumbs, setBreadcrumbs] = useState([])
    const [selectedIds, setSelectedIds] = useState([])
    const [bulkDeleting, setBulkDeleting] = useState(false)

    // Refs for keyboard shortcut handler
    const uploadInputRef = useRef(null)
    const keyStateRef = useRef({})
    const handleBulkDeleteRef = useRef(null)

    // Modals
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [uploads, setUploads] = useState([])
    const [contextMenu, setContextMenu] = useState(null)
    const [previewItem, setPreviewItem] = useState(null)
    const [shareItem, setShareItem] = useState(null)
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
            const { data } = await createFolder({
                name,
                parentId: folderId || null,
            })
            const newFolder = data.data
            toast.success('Folder created')
            setShowNewFolder(false)
            if (newFolder) {
                setFolders((prev) => [newFolder, ...prev])
            } else {
                fetchContents()
            }
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

    // Check storage before uploading, returns remaining bytes or throws
    const checkStorage = async (totalBytes) => {
        const { data } = await getStorageBreakdown()
        const used = data.data?.storageUsed ?? 0
        const limit = data.data?.storageLimit ?? 0
        const remaining = limit - used
        if (totalBytes > remaining) {
            const { formatFileSize } = await import('../../utils/fileIcons')
            throw new Error(
                `Not enough storage. Need ${formatFileSize(totalBytes)}, only ${formatFileSize(Math.max(0, remaining))} remaining.`
            )
        }
    }

    const handleUpload = async (fileList) => {
        const filesToUpload = Array.from(fileList)
        const totalSize = filesToUpload.reduce((s, f) => s + f.size, 0)

        try {
            await checkStorage(totalSize)
        } catch (err) {
            toast.error(err.message)
            return
        }

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
                const uploadRes = await uploadFile(formData, (e) => {
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
                const newFile = uploadRes?.data?.data
                if (newFile) {
                    setFiles((prev) => [newFile, ...prev])
                }
            } catch (err) {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === uploadId ? { ...u, error: true } : u
                    )
                )
                toast.error(`Failed to upload ${file.name}`)
            }
        }
    }

    // Upload an entire folder — creates a root folder then uploads all files flat inside it
    const handleFolderUpload = async (fileList) => {
        const filesToUpload = Array.from(fileList)
        if (filesToUpload.length === 0) return

        const totalSize = filesToUpload.reduce((s, f) => s + f.size, 0)
        try {
            await checkStorage(totalSize)
        } catch (err) {
            toast.error(err.message)
            return
        }

        // Derive root folder name from webkitRelativePath
        const rootName =
            filesToUpload[0].webkitRelativePath?.split('/')[0] ||
            'Uploaded Folder'

        let rootFolder
        try {
            const { data } = await createFolder({
                name: rootName,
                parentId: folderId || null,
            })
            rootFolder = data.data
            if (rootFolder) setFolders((prev) => [rootFolder, ...prev])
        } catch {
            toast.error('Failed to create folder')
            return
        }

        // Upload all files into the root folder
        for (const file of filesToUpload) {
            const uploadId = Date.now() + Math.random()
            setUploads((prev) => [
                ...prev,
                { id: uploadId, name: file.name, progress: 0 },
            ])
            const formData = new FormData()
            formData.append('file', file)
            if (rootFolder?._id) formData.append('folderId', rootFolder._id)

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
            } catch {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === uploadId ? { ...u, error: true } : u
                    )
                )
                toast.error(`Failed to upload ${file.name}`)
            }
        }
        toast.success(`Folder "${rootName}" uploaded`)
    }

    const handleDelete = async (item, type) => {
        // Optimistic removal
        if (type === 'folder') {
            setFolders((prev) => prev.filter((f) => f._id !== item._id))
        } else {
            setFiles((prev) => prev.filter((f) => f._id !== item._id))
        }
        setSelectedIds((prev) => prev.filter((id) => id !== item._id))
        try {
            if (type === 'folder') {
                await deleteFolder(item._id)
            } else {
                await deleteFile(item._id)
            }
            toast.success('Moved to trash')
        } catch (err) {
            toast.error('Failed to delete')
            fetchContents() // restore on error
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return
        const count = selectedIds.length
        setBulkDeleting(true)

        // Optimistic removal
        const selectedSet = new Set(selectedIds)
        setFolders((prev) => prev.filter((f) => !selectedSet.has(f._id)))
        setFiles((prev) => prev.filter((f) => !selectedSet.has(f._id)))
        setSelectedIds([])

        // Determine type for each id
        const folderIds = folders
            .filter((f) => selectedSet.has(f._id))
            .map((f) => f._id)
        const fileIds = files
            .filter((f) => selectedSet.has(f._id))
            .map((f) => f._id)

        try {
            await Promise.all([
                ...folderIds.map((id) => deleteFolder(id)),
                ...fileIds.map((id) => deleteFile(id)),
            ])
            toast.success(`${count} item${count > 1 ? 's' : ''} moved to trash`)
        } catch {
            toast.error('Some items could not be deleted')
            fetchContents() // restore on error
        } finally {
            setBulkDeleting(false)
        }
    }

    // Sync latest state/handler into refs so the effect below can read them without re-registering
    keyStateRef.current = {
        folders,
        files,
        selectedIds,
        showNewFolder,
        previewItem,
        shareItem,
        moveItem,
    }
    handleBulkDeleteRef.current = handleBulkDelete

    // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
    // Ctrl+A / ⌘A  → select all
    // Del / Backspace → delete selected
    // Escape         → deselect → close modals
    // N              → new folder
    // U              → upload
    // ───────────────────────────────────────────────────────────────────────────
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const isInInput = () => {
            const el = document.activeElement
            return (
                el?.tagName === 'INPUT' ||
                el?.tagName === 'TEXTAREA' ||
                el?.tagName === 'SELECT' ||
                el?.isContentEditable
            )
        }

        const onKey = (e) => {
            const {
                folders,
                files,
                selectedIds,
                showNewFolder,
                previewItem,
                shareItem,
                moveItem,
            } = keyStateRef.current

            const anyModalOpen =
                showNewFolder || previewItem || shareItem || moveItem

            // Ctrl+A / ⌘A — select all
            if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === 'a' &&
                !isInInput()
            ) {
                e.preventDefault()
                setSelectedIds([
                    ...folders.map((f) => f._id),
                    ...files.map((f) => f._id),
                ])
                return
            }

            // Del / Backspace — bulk delete selected
            if (
                (e.key === 'Delete' || e.key === 'Backspace') &&
                !isInInput() &&
                selectedIds.length > 0
            ) {
                e.preventDefault()
                handleBulkDeleteRef.current?.()
                return
            }

            // Escape — deselect first, then close modals one by one
            if (e.key === 'Escape' && !isInInput()) {
                if (selectedIds.length > 0) {
                    setSelectedIds([])
                    return
                }
                if (showNewFolder) {
                    setShowNewFolder(false)
                    return
                }
                if (previewItem) {
                    setPreviewItem(null)
                    return
                }
                if (shareItem) {
                    setShareItem(null)
                    return
                }
                if (moveItem) {
                    setMoveItem(null)
                    return
                }
                return
            }

            // N — new folder (no modal, not typing)
            if (
                e.key.toLowerCase() === 'n' &&
                !isInInput() &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey &&
                !anyModalOpen
            ) {
                e.preventDefault()
                setShowNewFolder(true)
                return
            }

            // U — upload file (no modal, not typing)
            if (
                e.key.toLowerCase() === 'u' &&
                !isInInput() &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey &&
                !anyModalOpen
            ) {
                e.preventDefault()
                uploadInputRef.current?.click()
                return
            }
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, []) // intentionally empty — state is accessed via keyStateRef

    const handleStar = async (item, type) => {
        const newStarred = !item.isStarred
        // Optimistic update
        if (type === 'folder') {
            setFolders((prev) =>
                prev.map((f) =>
                    f._id === item._id ? { ...f, isStarred: newStarred } : f
                )
            )
        } else {
            setFiles((prev) =>
                prev.map((f) =>
                    f._id === item._id ? { ...f, isStarred: newStarred } : f
                )
            )
        }
        try {
            if (type === 'folder') {
                await toggleFolderStar(item._id)
            } else {
                await toggleFileStar(item._id)
            }
            toast.success(newStarred ? 'Starred' : 'Unstarred')
        } catch {
            toast.error('Failed to update star')
            // Revert on error
            if (type === 'folder') {
                setFolders((prev) =>
                    prev.map((f) =>
                        f._id === item._id
                            ? { ...f, isStarred: item.isStarred }
                            : f
                    )
                )
            } else {
                setFiles((prev) =>
                    prev.map((f) =>
                        f._id === item._id
                            ? { ...f, isStarred: item.isStarred }
                            : f
                    )
                )
            }
        }
    }

    const handleDuplicate = async (item, type) => {
        try {
            let res
            if (type === 'folder') {
                res = await duplicateFolder(item._id)
                const copy = res?.data?.data
                if (copy) setFolders((prev) => [...prev, copy])
                else fetchContents()
            } else {
                res = await duplicateFile(item._id)
                const copy = res?.data?.data
                if (copy) setFiles((prev) => [...prev, copy])
                else fetchContents()
            }
            toast.success('Duplicated')
        } catch {
            toast.error('Failed to duplicate')
        }
    }

    const handleRename = (id, newName, type) => {
        if (type === 'folder') {
            setFolders((prev) =>
                prev.map((f) => (f._id === id ? { ...f, name: newName } : f))
            )
        } else {
            setFiles((prev) =>
                prev.map((f) => (f._id === id ? { ...f, name: newName } : f))
            )
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
                    <label
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-sm font-medium"
                        title="Upload files (U)"
                    >
                        <HiOutlineUpload className="w-4 h-4" />
                        Upload
                        <input
                            ref={uploadInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files)}
                        />
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer text-sm font-medium">
                        <HiOutlineCollection className="w-4 h-4" />
                        Upload Folder
                        <input
                            type="file"
                            className="hidden"
                            // eslint-disable-next-line react/no-unknown-property
                            webkitdirectory=""
                            mozdirectory=""
                            onChange={(e) => handleFolderUpload(e.target.files)}
                        />
                    </label>
                    <button
                        onClick={() => setShowNewFolder(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
                        title="New folder (N)"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        New Folder
                    </button>
                </div>
            </div>

            {/* Bulk action toolbar */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-sm font-medium text-blue-700">
                        {selectedIds.length} selected
                    </span>
                    <span className="text-xs text-blue-400 font-mono border border-blue-200 rounded px-1 py-px hidden sm:block">
                        Ctrl+A
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 bg-white rounded-lg hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                        title="Delete selected (Del)"
                    >
                        <HiOutlineTrash className="w-4 h-4" />
                        {bulkDeleting ? 'Deleting...' : 'Delete selected'}
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                        title="Deselect all (Esc)"
                    >
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>
            )}

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
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRename={handleRename}
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
