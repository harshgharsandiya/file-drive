import {
    HiOutlineFolder,
    HiOutlineDocument,
    HiOutlinePhotograph,
    HiOutlineFilm,
    HiOutlineMusicNote,
    HiOutlineCode,
    HiOutlineDocumentText,
} from 'react-icons/hi'

const iconMap = {
    // Images
    jpg: { icon: HiOutlinePhotograph, color: 'text-red-500' },
    jpeg: { icon: HiOutlinePhotograph, color: 'text-red-500' },
    png: { icon: HiOutlinePhotograph, color: 'text-red-500' },
    gif: { icon: HiOutlinePhotograph, color: 'text-red-500' },
    webp: { icon: HiOutlinePhotograph, color: 'text-red-500' },
    svg: { icon: HiOutlinePhotograph, color: 'text-red-500' },

    // Video
    mp4: { icon: HiOutlineFilm, color: 'text-purple-500' },
    webm: { icon: HiOutlineFilm, color: 'text-purple-500' },
    mov: { icon: HiOutlineFilm, color: 'text-purple-500' },
    avi: { icon: HiOutlineFilm, color: 'text-purple-500' },

    // Audio
    mp3: { icon: HiOutlineMusicNote, color: 'text-pink-500' },
    wav: { icon: HiOutlineMusicNote, color: 'text-pink-500' },
    ogg: { icon: HiOutlineMusicNote, color: 'text-pink-500' },

    // Code
    js: { icon: HiOutlineCode, color: 'text-yellow-500' },
    ts: { icon: HiOutlineCode, color: 'text-blue-500' },
    jsx: { icon: HiOutlineCode, color: 'text-yellow-500' },
    tsx: { icon: HiOutlineCode, color: 'text-blue-500' },
    html: { icon: HiOutlineCode, color: 'text-orange-500' },
    css: { icon: HiOutlineCode, color: 'text-blue-400' },
    json: { icon: HiOutlineCode, color: 'text-gray-500' },

    // Documents
    pdf: { icon: HiOutlineDocumentText, color: 'text-red-600' },
    doc: { icon: HiOutlineDocumentText, color: 'text-blue-600' },
    docx: { icon: HiOutlineDocumentText, color: 'text-blue-600' },
    txt: { icon: HiOutlineDocumentText, color: 'text-gray-500' },
    md: { icon: HiOutlineDocumentText, color: 'text-gray-600' },
    csv: { icon: HiOutlineDocumentText, color: 'text-green-600' },
    xls: { icon: HiOutlineDocumentText, color: 'text-green-600' },
    xlsx: { icon: HiOutlineDocumentText, color: 'text-green-600' },
}

export function getFileIcon(type) {
    return (
        iconMap[type?.toLowerCase()] || {
            icon: HiOutlineDocument,
            color: 'text-gray-400',
        }
    )
}

export function FolderIcon({ className = 'w-5 h-5' }) {
    return <HiOutlineFolder className={`text-blue-500 ${className}`} />
}

export function FileIcon({ type, className = 'w-5 h-5' }) {
    const { icon: Icon, color } = getFileIcon(type)
    return <Icon className={`${color} ${className}`} />
}

export function formatFileSize(bytes) {
    if (bytes === null || bytes === undefined) return '—'
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024
        i++
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
