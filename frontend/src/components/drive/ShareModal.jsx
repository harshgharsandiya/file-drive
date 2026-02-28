import { useState, useEffect } from 'react'
import { HiOutlineX, HiOutlineLink, HiOutlineTrash } from 'react-icons/hi'
import {
    shareWithUser,
    createPublicLink,
    getSharesForItem,
    revokeShare,
} from '../../services/drive.service'
import toast from 'react-hot-toast'

export default function ShareModal({ item, onClose }) {
    const [email, setEmail] = useState('')
    const [permission, setPermission] = useState('view')
    const [shares, setShares] = useState([])
    const [loading, setLoading] = useState(false)
    const [publicLink, setPublicLink] = useState(null)

    useEffect(() => {
        fetchShares()
    }, [item._id])

    const fetchShares = async () => {
        try {
            const { data } = await getSharesForItem(item._id)
            setShares(data.data || [])
            // Check for existing public link
            const link = (data.data || []).find((s) => s.linkToken)
            if (link) setPublicLink(link)
        } catch (err) {
            // ignore
        }
    }

    const handleShareWithUser = async (e) => {
        e.preventDefault()
        if (!email.trim()) return
        setLoading(true)
        try {
            await shareWithUser({
                itemId: item._id,
                itemType: item.itemType,
                email: email.trim(),
                permission,
            })
            toast.success(`Shared with ${email}`)
            setEmail('')
            fetchShares()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to share')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateLink = async () => {
        try {
            const { data } = await createPublicLink({
                itemId: item._id,
                itemType: item.itemType,
                permission: 'view',
                expiresIn: 168 * 3600, // 7 days in seconds
            })
            setPublicLink(data.data)
            const link = `${window.location.origin}/shared/link/${data.data.linkToken}`
            await navigator.clipboard.writeText(link)
            toast.success('Link copied to clipboard!')
            fetchShares()
        } catch (err) {
            toast.error('Failed to create link')
        }
    }

    const handleRemoveShare = async (shareId) => {
        try {
            await revokeShare(shareId)
            toast.success('Share removed')
            fetchShares()
        } catch (err) {
            toast.error('Failed to remove share')
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
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Share "{item.name}"
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                    >
                        <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Share with email */}
                <form
                    onSubmit={handleShareWithUser}
                    className="flex gap-2 mb-4"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <select
                        value={permission}
                        onChange={(e) => setPermission(e.target.value)}
                        className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="view">View</option>
                        <option value="comment">Comment</option>
                        <option value="edit">Edit</option>
                    </select>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                        Share
                    </button>
                </form>

                {/* Public link */}
                <button
                    onClick={handleCreateLink}
                    className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer mb-4"
                >
                    <HiOutlineLink className="w-4 h-4" />
                    {publicLink ? 'Copy public link' : 'Create public link'}
                </button>

                {/* Shared users list */}
                {shares.length > 0 && (
                    <div>
                        <h4 className="text-xs text-gray-500 font-medium mb-2 uppercase">
                            Shared with
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-auto">
                            {shares.map((share) => (
                                <div
                                    key={share._id}
                                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            {share.sharedWith?.email ||
                                                'Public link'}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">
                                            {share.permission}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleRemoveShare(share._id)
                                        }
                                        className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
