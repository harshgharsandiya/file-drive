import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import {
    HiOutlineDotsVertical,
    HiOutlineShare,
    HiOutlinePencil,
    HiOutlineArrowRight,
    HiOutlineTrash,
    HiOutlineDownload,
    HiOutlineStar,
    HiOutlineDuplicate,
    HiOutlineEye,
    HiOutlineCheck,
} from 'react-icons/hi'
import { FolderIcon, FileIcon, formatFileSize } from '../../utils/fileIcons'
import { renameFile, renameFolder } from '../../services/drive.service'
import toast from 'react-hot-toast'

function ActionDropdown({ item, type, onAction, onStartRename }) {
    const [open, setOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState({})
    const btnRef = useRef(null)

    // Close on outside click or scroll
    useEffect(() => {
        if (!open) return
        const close = () => setOpen(false)
        document.addEventListener('mousedown', close)
        document.addEventListener('scroll', close, true)
        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('scroll', close, true)
        }
    }, [open])

    const handleToggle = (e) => {
        e.stopPropagation()
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        const MENU_HEIGHT = 280 // approx max height of menu
        const MENU_WIDTH = 180

        const spaceBelow = window.innerHeight - rect.bottom
        const openUpward = spaceBelow < MENU_HEIGHT && rect.top > spaceBelow

        // Ensure menu never goes off the right edge
        let left = rect.right - MENU_WIDTH
        if (left < 8) left = 8

        setMenuStyle({
            position: 'fixed',
            left,
            width: MENU_WIDTH,
            zIndex: 9999,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        })
        setOpen((v) => !v)
    }

    const actions =
        type === 'folder'
            ? [
                  {
                      action: 'star',
                      icon: HiOutlineStar,
                      label: item.isStarred ? 'Unstar' : 'Star',
                  },
                  { action: 'share', icon: HiOutlineShare, label: 'Share' },
                  { action: 'rename', icon: HiOutlinePencil, label: 'Rename' },
                  {
                      action: 'move',
                      icon: HiOutlineArrowRight,
                      label: 'Move to',
                  },
                  {
                      action: 'duplicate',
                      icon: HiOutlineDuplicate,
                      label: 'Duplicate',
                  },
                  {
                      action: 'delete',
                      icon: HiOutlineTrash,
                      label: 'Delete',
                      danger: true,
                  },
              ]
            : [
                  { action: 'preview', icon: HiOutlineEye, label: 'Preview' },
                  {
                      action: 'download',
                      icon: HiOutlineDownload,
                      label: 'Download',
                  },
                  {
                      action: 'star',
                      icon: HiOutlineStar,
                      label: item.isStarred ? 'Unstar' : 'Star',
                  },
                  { action: 'share', icon: HiOutlineShare, label: 'Share' },
                  { action: 'rename', icon: HiOutlinePencil, label: 'Rename' },
                  {
                      action: 'move',
                      icon: HiOutlineArrowRight,
                      label: 'Move to',
                  },
                  {
                      action: 'duplicate',
                      icon: HiOutlineDuplicate,
                      label: 'Duplicate',
                  },
                  {
                      action: 'delete',
                      icon: HiOutlineTrash,
                      label: 'Delete',
                      danger: true,
                  },
              ]

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleToggle}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title="More actions"
            >
                <HiOutlineDotsVertical className="w-4 h-4" />
            </button>
            {open &&
                createPortal(
                    <div
                        style={menuStyle}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5"
                    >
                        {actions.map(
                            ({ action, icon: Icon, label, danger }) => (
                                <button
                                    key={action}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpen(false)
                                        if (action === 'rename') {
                                            onStartRename(item, type)
                                        } else {
                                            onAction(action, item, type)
                                        }
                                    }}
                                    className={`w-full px-3 py-2 flex items-center gap-3 text-sm transition cursor-pointer
                                ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            )
                        )}
                    </div>,
                    document.body
                )}
        </>
    )
}

// Inline rename input shown in place of item name
function InlineRenameInput({ initialName, onCommit, onCancel }) {
    const [value, setValue] = useState(initialName)
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.select()
    }, [])

    const commit = () => {
        const trimmed = value.trim()
        if (trimmed && trimmed !== initialName) {
            onCommit(trimmed)
        } else {
            onCancel()
        }
    }

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    commit()
                }
                if (e.key === 'Escape') {
                    e.preventDefault()
                    onCancel()
                }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-gray-700 border border-blue-400 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs"
        />
    )
}

export default function FileList({
    folders,
    files,
    loading,
    onFolderClick,
    onFileClick,
    onContextMenu,
    onAction,
    selectedIds = [],
    onSelectionChange,
    onRename,
}) {
    // Inline rename state
    const [editingId, setEditingId] = useState(null)
    const [editingType, setEditingType] = useState(null)

    // Drag-to-select state
    const dragStartId = useRef(null)
    const isDragging = useRef(false)

    const startRename = useCallback((item, type) => {
        setEditingId(item._id)
        setEditingType(type)
    }, [])

    const commitRename = useCallback(
        async (item, type, newName) => {
            setEditingId(null)
            setEditingType(null)
            try {
                if (type === 'folder') {
                    await renameFolder(item._id, newName)
                } else {
                    await renameFile(item._id, newName)
                }
                toast.success('Renamed successfully')
                onRename?.(item._id, newName, type)
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to rename')
            }
        },
        [onRename]
    )

    const cancelRename = useCallback(() => {
        setEditingId(null)
        setEditingType(null)
    }, [])

    const toggleSelect = useCallback(
        (id, e) => {
            if (!onSelectionChange) return
            e.stopPropagation()
            if (e.shiftKey && selectedIds.length > 0) {
                // Range: collect all visible ids in order (folders then files)
                const allIds = [
                    ...folders.map((f) => f._id),
                    ...files.map((f) => f._id),
                ]
                const lastId = selectedIds[selectedIds.length - 1]
                const a = allIds.indexOf(lastId)
                const b = allIds.indexOf(id)
                const [lo, hi] = a < b ? [a, b] : [b, a]
                const range = allIds.slice(lo, hi + 1)
                const merged = [...new Set([...selectedIds, ...range])]
                onSelectionChange(merged)
            } else {
                onSelectionChange(
                    selectedIds.includes(id)
                        ? selectedIds.filter((s) => s !== id)
                        : [...selectedIds, id]
                )
            }
        },
        [selectedIds, onSelectionChange, folders, files]
    )

    // Drag-to-select handlers
    const handleRowMouseDown = useCallback((id, e) => {
        if (e.button !== 0) return
        dragStartId.current = id
        isDragging.current = false
    }, [])

    const handleRowMouseEnter = useCallback(
        (id) => {
            if (dragStartId.current === null) return
            isDragging.current = true
            if (!onSelectionChange) return
            const allIds = [
                ...folders.map((f) => f._id),
                ...files.map((f) => f._id),
            ]
            const a = allIds.indexOf(dragStartId.current)
            const b = allIds.indexOf(id)
            if (a === -1 || b === -1) return
            const [lo, hi] = a < b ? [a, b] : [b, a]
            onSelectionChange(allIds.slice(lo, hi + 1))
        },
        [folders, files, onSelectionChange]
    )

    useEffect(() => {
        const onMouseUp = () => {
            dragStartId.current = null
            isDragging.current = false
        }
        window.addEventListener('mouseup', onMouseUp)
        return () => window.removeEventListener('mouseup', onMouseUp)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (folders.length === 0 && files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg
                    className="w-16 h-16 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                </svg>
                <p className="text-lg font-medium">No files or folders</p>
                <p className="text-sm mt-1">
                    Upload files or create a new folder
                </p>
            </div>
        )
    }

    return (
        <div>
            {/* Folders */}
            {folders.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Folders
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {folders.map((folder) => {
                            const isSelected = selectedIds.includes(folder._id)
                            const isEditing = editingId === folder._id
                            return (
                                <div
                                    key={folder._id}
                                    onClick={() =>
                                        !isEditing && onFolderClick(folder)
                                    }
                                    onContextMenu={(e) =>
                                        onContextMenu(e, folder, 'folder')
                                    }
                                    onMouseDown={(e) =>
                                        handleRowMouseDown(folder._id, e)
                                    }
                                    onMouseEnter={() =>
                                        handleRowMouseEnter(folder._id)
                                    }
                                    className={`relative flex items-center gap-2 p-3 bg-white border rounded-xl
                                        cursor-pointer transition group select-none
                                        ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-blue-50 hover:border-blue-200'}`}
                                >
                                    {/* Checkbox */}
                                    <div
                                        onClick={(e) =>
                                            toggleSelect(folder._id, e)
                                        }
                                        className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer
                                            ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white opacity-0 group-hover:opacity-100'}`}
                                    >
                                        {isSelected && (
                                            <HiOutlineCheck className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <FolderIcon className="w-5 h-5 shrink-0" />
                                    {isEditing ? (
                                        <InlineRenameInput
                                            initialName={folder.name}
                                            onCommit={(n) =>
                                                commitRename(
                                                    folder,
                                                    'folder',
                                                    n
                                                )
                                            }
                                            onCancel={cancelRename}
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-700 truncate flex-1">
                                            {folder.name}
                                        </span>
                                    )}
                                    {folder.isStarred && !isEditing && (
                                        <HiOutlineStar className="w-4 h-4 text-yellow-500 shrink-0" />
                                    )}
                                    {!isEditing && (
                                        <div className="opacity-0 group-hover:opacity-100 transition shrink-0">
                                            <ActionDropdown
                                                item={folder}
                                                type="folder"
                                                onAction={onAction}
                                                onStartRename={startRename}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Files */}
            {files.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Files
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-visible">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 w-8">
                                        {/* select-all checkbox */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!onSelectionChange) return
                                                const allFileIds = files.map(
                                                    (f) => f._id
                                                )
                                                const allSelected =
                                                    allFileIds.every((id) =>
                                                        selectedIds.includes(id)
                                                    )
                                                if (allSelected) {
                                                    onSelectionChange(
                                                        selectedIds.filter(
                                                            (id) =>
                                                                !allFileIds.includes(
                                                                    id
                                                                )
                                                        )
                                                    )
                                                } else {
                                                    onSelectionChange([
                                                        ...new Set([
                                                            ...selectedIds,
                                                            ...allFileIds,
                                                        ]),
                                                    ])
                                                }
                                            }}
                                            className="w-4 h-4 rounded border border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:border-blue-400 transition"
                                        >
                                            {files.every((f) =>
                                                selectedIds.includes(f._id)
                                            ) &&
                                                files.length > 0 && (
                                                    <HiOutlineCheck className="w-3 h-3 text-blue-600" />
                                                )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3 hidden sm:table-cell">
                                        Size
                                    </th>
                                    <th className="px-4 py-3 hidden md:table-cell">
                                        Modified
                                    </th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {files.map((file) => {
                                    const isSelected = selectedIds.includes(
                                        file._id
                                    )
                                    const isEditing = editingId === file._id
                                    return (
                                        <tr
                                            key={file._id}
                                            onClick={() =>
                                                !isEditing && onFileClick(file)
                                            }
                                            onContextMenu={(e) =>
                                                onContextMenu(e, file, 'file')
                                            }
                                            onMouseDown={(e) =>
                                                handleRowMouseDown(file._id, e)
                                            }
                                            onMouseEnter={() =>
                                                handleRowMouseEnter(file._id)
                                            }
                                            className={`cursor-pointer transition group select-none
                                                ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="px-4 py-3 w-8">
                                                <div
                                                    onClick={(e) =>
                                                        toggleSelect(
                                                            file._id,
                                                            e
                                                        )
                                                    }
                                                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                                                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white opacity-0 group-hover:opacity-100'}`}
                                                >
                                                    {isSelected && (
                                                        <HiOutlineCheck className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <FileIcon
                                                        type={file.type}
                                                        className="w-5 h-5 shrink-0"
                                                    />
                                                    {isEditing ? (
                                                        <InlineRenameInput
                                                            initialName={
                                                                file.name
                                                            }
                                                            onCommit={(n) =>
                                                                commitRename(
                                                                    file,
                                                                    'file',
                                                                    n
                                                                )
                                                            }
                                                            onCancel={
                                                                cancelRename
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-700 truncate max-w-50 sm:max-w-none">
                                                            {file.name}
                                                        </span>
                                                    )}
                                                    {file.isStarred &&
                                                        !isEditing && (
                                                            <HiOutlineStar className="w-4 h-4 text-yellow-500 shrink-0" />
                                                        )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className="text-sm text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="text-sm text-gray-500">
                                                    {file.updatedAt
                                                        ? format(
                                                              new Date(
                                                                  file.updatedAt
                                                              ),
                                                              'MMM d, yyyy'
                                                          )
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="opacity-0 group-hover:opacity-100 transition z-10">
                                                    <ActionDropdown
                                                        item={file}
                                                        type="file"
                                                        onAction={onAction}
                                                        onStartRename={
                                                            startRename
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
