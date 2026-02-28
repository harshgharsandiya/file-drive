import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    HiOutlineShare,
    HiOutlineEye,
    HiOutlineDownload,
    HiOutlinePencil,
    HiOutlineDotsVertical,
} from 'react-icons/hi'
import {
    getSharedWithMe,
    downloadFile,
    renameFile,
} from '../../services/drive.service'
import { FolderIcon, FileIcon } from '../../utils/fileIcons'
import PreviewModal from '../../components/drive/PreviewModal'
import toast from 'react-hot-toast'

// Permission hierarchy
const PERMISSION_LEVELS = { view: 1, comment: 2, edit: 3 }
function atLeast(userPerm, required) {
    return (
        (PERMISSION_LEVELS[userPerm] || 0) >= (PERMISSION_LEVELS[required] || 0)
    )
}

// Inline rename input
function InlineRenameInput({ initialName, onCommit, onCancel }) {
    const [value, setValue] = useState(initialName)
    const ref = useRef(null)
    useEffect(() => {
        ref.current?.select()
    }, [])
    const commit = () => {
        const t = value.trim()
        if (t && t !== initialName) onCommit(t)
        else onCancel()
    }
    return (
        <input
            ref={ref}
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

function SharedActionMenu({
    share,
    item,
    onPreview,
    onDownload,
    onStartRename,
}) {
    const [open, setOpen] = useState(false)
    const [openUpward, setOpenUpward] = useState(true)
    const ref = useRef(null)
    const btnRef = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const canEdit = atLeast(share.permission, 'edit')
    const isFile = share.itemType === 'file'

    const actions = [
        isFile && { label: 'Preview', icon: HiOutlineEye, fn: onPreview },
        isFile && {
            label: 'Download',
            icon: HiOutlineDownload,
            fn: onDownload,
        },
        isFile &&
            canEdit && {
                label: 'Rename',
                icon: HiOutlinePencil,
                fn: onStartRename,
            },
    ].filter(Boolean)

    if (actions.length === 0) return null

    const handleToggle = (e) => {
        e.stopPropagation()
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            setOpenUpward(rect.top > spaceBelow || spaceBelow < 180)
        }
        setOpen((v) => !v)
    }

    return (
        <div ref={ref} className="relative">
            <button
                ref={btnRef}
                onClick={handleToggle}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title="More actions"
            >
                <HiOutlineDotsVertical className="w-4 h-4" />
            </button>
            {open && (
                <div
                    className={`absolute right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-40
                    ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                >
                    {actions.map(({ label, icon: Icon, fn }) => (
                        <button
                            key={label}
                            onClick={(e) => {
                                e.stopPropagation()
                                setOpen(false)
                                fn()
                            }}
                            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function SharedWithMe() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [previewFile, setPreviewFile] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchShared()
    }, [])

    const fetchShared = async () => {
        try {
            const { data } = await getSharedWithMe()
            setItems(data.data || [])
        } catch {
            toast.error('Failed to load shared items')
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

    const handleCommitRename = useCallback(async (item, newName) => {
        setEditingId(null)
        try {
            await renameFile(item._id, newName)
            toast.success('Renamed successfully')
            setItems((prev) =>
                prev.map((row) =>
                    row.item._id === item._id
                        ? { ...row, item: { ...row.item, name: newName } }
                        : row
                )
            )
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to rename')
        }
    }, [])

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
                <div className="bg-white border border-gray-200 rounded-xl overflow-visible">
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
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(({ share, item }) => (
                                <tr
                                    key={share._id}
                                    className="hover:bg-gray-50 cursor-pointer transition group"
                                    onClick={() => {
                                        if (editingId === item._id) return
                                        if (share.itemType === 'folder') {
                                            navigate(`/folder/${item._id}`)
                                        } else {
                                            setPreviewFile(item)
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
                                            {editingId === item._id ? (
                                                <InlineRenameInput
                                                    initialName={item.name}
                                                    onCommit={(n) =>
                                                        handleCommitRename(
                                                            item,
                                                            n
                                                        )
                                                    }
                                                    onCancel={() =>
                                                        setEditingId(null)
                                                    }
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-700">
                                                    {item.name}
                                                </span>
                                            )}
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
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                                share.permission === 'edit'
                                                    ? 'bg-green-50 text-green-700'
                                                    : share.permission ===
                                                        'comment'
                                                      ? 'bg-yellow-50 text-yellow-700'
                                                      : 'bg-blue-50 text-blue-700'
                                            }`}
                                        >
                                            {share.permission}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div
                                            className="opacity-0 group-hover:opacity-100 transition"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <SharedActionMenu
                                                share={share}
                                                item={item}
                                                onPreview={() =>
                                                    setPreviewFile(item)
                                                }
                                                onDownload={() =>
                                                    handleDownload(item)
                                                }
                                                onStartRename={() =>
                                                    setEditingId(item._id)
                                                }
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Preview modal */}
            {previewFile && (
                <PreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                    onAction={null}
                />
            )}
        </div>
    )
}
