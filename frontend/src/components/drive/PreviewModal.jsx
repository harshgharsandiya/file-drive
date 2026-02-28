import { useState, useEffect } from 'react'
import {
    HiOutlineX,
    HiOutlineDownload,
    HiOutlineShare,
    HiOutlineStar,
    HiOutlinePencil,
    HiOutlineArrowRight,
    HiOutlineTrash,
    HiOutlineDuplicate,
} from 'react-icons/hi'
import { previewFile, downloadFile } from '../../services/drive.service'
import { FileIcon, formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
const videoTypes = ['mp4', 'webm']
const audioTypes = ['mp3', 'wav', 'ogg']
const textTypes = ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js', 'ts']

export default function PreviewModal({ file, onClose, onAction }) {
    const [previewData, setPreviewData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPreview()
    }, [file._id])

    const fetchPreview = async () => {
        try {
            const { data } = await previewFile(file._id)
            setPreviewData(data.data)
        } catch (err) {
            // Not all files are previewable
            setPreviewData(null)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        try {
            const { data } = await downloadFile(file._id)
            window.open(data.data.downloadUrl, '_blank')
        } catch (err) {
            toast.error('Download failed')
        }
    }

    const type = file.type?.toLowerCase()
    const isImage = imageTypes.includes(type)
    const isVideo = videoTypes.includes(type)
    const isAudio = audioTypes.includes(type)
    const isPdf = type === 'pdf'

    const renderPreview = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )
        }

        if (!previewData?.previewUrl) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FileIcon type={type} className="w-16 h-16 mb-4" />
                    <p>Preview not available for this file type</p>
                </div>
            )
        }

        const url = previewData.previewUrl

        if (isImage) {
            return (
                <img
                    src={url}
                    alt={file.name}
                    className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
            )
        }

        if (isVideo) {
            return (
                <video controls className="max-w-full max-h-[70vh] mx-auto">
                    <source src={url} />
                </video>
            )
        }

        if (isAudio) {
            return (
                <div className="flex items-center justify-center h-32">
                    <audio controls src={url} className="w-full max-w-md" />
                </div>
            )
        }

        if (isPdf) {
            return (
                <iframe
                    src={url}
                    className="w-full h-[70vh]"
                    title={file.name}
                />
            )
        }

        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileIcon type={type} className="w-16 h-16 mb-4" />
                <p>Preview not available</p>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                        <FileIcon type={type} className="w-5 h-5 shrink-0" />
                        <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                                {file.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Download"
                        >
                            <HiOutlineDownload className="w-5 h-5" />
                        </button>
                        {onAction && (
                            <>
                                <button
                                    onClick={() => {
                                        onAction('share', file, 'file')
                                        onClose()
                                    }}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Share"
                                >
                                    <HiOutlineShare className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        onAction('star', file, 'file')
                                    }}
                                    className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition cursor-pointer"
                                    title={file.isStarred ? 'Unstar' : 'Star'}
                                >
                                    <HiOutlineStar
                                        className={`w-5 h-5 ${file.isStarred ? 'text-yellow-500 fill-yellow-500' : ''}`}
                                    />
                                </button>
                                <button
                                    onClick={() => {
                                        onAction('rename', file, 'file')
                                        onClose()
                                    }}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Rename"
                                >
                                    <HiOutlinePencil className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        onAction('move', file, 'file')
                                        onClose()
                                    }}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Move to"
                                >
                                    <HiOutlineArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        onAction('duplicate', file, 'file')
                                    }}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Duplicate"
                                >
                                    <HiOutlineDuplicate className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        onAction('delete', file, 'file')
                                        onClose()
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                    title="Delete"
                                >
                                    <HiOutlineTrash className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {renderPreview()}
                </div>
            </div>
        </div>
    )
}
