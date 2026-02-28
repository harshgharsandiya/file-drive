import { useEffect, useRef } from 'react'
import {
    HiOutlineEye,
    HiOutlineShare,
    HiOutlinePencil,
    HiOutlineArrowRight,
    HiOutlineTrash,
    HiOutlineDownload,
    HiOutlineFolderOpen,
    HiOutlineStar,
    HiOutlineDuplicate,
} from 'react-icons/hi'

const menuItems = {
    folder: [
        { action: 'open', icon: HiOutlineFolderOpen, label: 'Open' },
        { action: 'star', icon: HiOutlineStar, label: 'Star' },
        { action: 'share', icon: HiOutlineShare, label: 'Share' },
        { action: 'rename', icon: HiOutlinePencil, label: 'Rename' },
        { action: 'move', icon: HiOutlineArrowRight, label: 'Move to' },
        { action: 'duplicate', icon: HiOutlineDuplicate, label: 'Duplicate' },
        {
            action: 'delete',
            icon: HiOutlineTrash,
            label: 'Delete',
            danger: true,
        },
    ],
    file: [
        { action: 'preview', icon: HiOutlineEye, label: 'Preview' },
        { action: 'download', icon: HiOutlineDownload, label: 'Download' },
        { action: 'star', icon: HiOutlineStar, label: 'Star' },
        { action: 'share', icon: HiOutlineShare, label: 'Share' },
        { action: 'rename', icon: HiOutlinePencil, label: 'Rename' },
        { action: 'move', icon: HiOutlineArrowRight, label: 'Move to' },
        { action: 'duplicate', icon: HiOutlineDuplicate, label: 'Duplicate' },
        {
            action: 'delete',
            icon: HiOutlineTrash,
            label: 'Delete',
            danger: true,
        },
    ],
}

export default function ContextMenu({ x, y, item, type, onAction, onClose }) {
    const ref = useRef(null)

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [onClose])

    // Keep menu in viewport
    const style = {
        top: Math.min(y, window.innerHeight - 300),
        left: Math.min(x, window.innerWidth - 200),
    }

    const items = menuItems[type] || []

    return (
        <div
            ref={ref}
            style={style}
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-45"
        >
            <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-xs text-gray-400 truncate">{item.name}</p>
            </div>
            {items.map(({ action, icon: Icon, label, danger }) => (
                <button
                    key={action}
                    onClick={() => onAction(action, item, type)}
                    className={`w-full px-3 py-2 flex items-center gap-3 text-sm transition cursor-pointer
                        ${
                            danger
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <Icon className="w-4 h-4" />
                    {label}
                </button>
            ))}
        </div>
    )
}
