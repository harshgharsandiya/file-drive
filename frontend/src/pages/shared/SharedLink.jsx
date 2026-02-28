import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getSharedByToken } from '../../services/drive.service'
import { FileIcon, FolderIcon, formatFileSize } from '../../utils/fileIcons'
import toast from 'react-hot-toast'

export default function SharedLink() {
    const { token } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchShared()
    }, [token])

    const fetchShared = async () => {
        try {
            const { data: res } = await getSharedByToken(token)
            setData(res.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Link not found or expired')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        )
    }

    const { share, item } = data

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-4">
                    {share.itemType === 'folder' ? (
                        <FolderIcon className="w-16 h-16" />
                    ) : (
                        <FileIcon type={item.type} className="w-16 h-16" />
                    )}
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-1">
                    {item.name}
                </h1>

                <p className="text-sm text-gray-500 mb-4">
                    Shared by{' '}
                    {share.ownerId?.name || share.ownerId?.email || 'Unknown'}
                </p>

                {item.size && (
                    <p className="text-sm text-gray-400 mb-4">
                        {formatFileSize(item.size)}
                    </p>
                )}

                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 capitalize">
                    {share.permission} access
                </span>
            </div>
        </div>
    )
}
