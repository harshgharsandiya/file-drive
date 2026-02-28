import { useState, useRef, useEffect } from 'react'
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
} from 'react-icons/hi'
import { FolderIcon, FileIcon, formatFileSize } from '../../utils/fileIcons'

function ActionDropdown({ item, type, onAction }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

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
        <div ref={ref} className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen(!open)
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title="More actions"
            >
                <HiOutlineDotsVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[180px]">
                    {actions.map(({ action, icon: Icon, label, danger }) => (
                        <button
                            key={action}
                            onClick={(e) => {
                                e.stopPropagation()
                                setOpen(false)
                                onAction(action, item, type)
                            }}
                            className={`w-full px-3 py-2 flex items-center gap-3 text-sm transition cursor-pointer
                                ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
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

export default function FileList({
    folders,
    files,
    loading,
    onFolderClick,
    onFileClick,
    onContextMenu,
    onAction,
}) {
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
                        {folders.map((folder) => (
                            <div
                                key={folder._id}
                                onClick={() => onFolderClick(folder)}
                                onContextMenu={(e) =>
                                    onContextMenu(e, folder, 'folder')
                                }
                                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl
                                    hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition group"
                            >
                                <FolderIcon className="w-6 h-6 shrink-0" />
                                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                                    {folder.name}
                                </span>
                                {folder.isStarred && (
                                    <HiOutlineStar className="w-4 h-4 text-yellow-500 shrink-0" />
                                )}
                                <div className="opacity-0 group-hover:opacity-100 transition shrink-0">
                                    <ActionDropdown
                                        item={folder}
                                        type="folder"
                                        onAction={onAction}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Files */}
            {files.length > 0 && (
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
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {files.map((file) => (
                                    <tr
                                        key={file._id}
                                        onClick={() => onFileClick(file)}
                                        onContextMenu={(e) =>
                                            onContextMenu(e, file, 'file')
                                        }
                                        className="hover:bg-gray-50 cursor-pointer transition group"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <FileIcon
                                                    type={file.type}
                                                    className="w-5 h-5 shrink-0"
                                                />
                                                <span className="text-sm text-gray-700 truncate max-w-[200px] sm:max-w-none">
                                                    {file.name}
                                                </span>
                                                {file.isStarred && (
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
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
