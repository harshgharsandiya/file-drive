import { useState } from 'react'
import { renameFile, renameFolder } from '../../services/drive.service'
import toast from 'react-hot-toast'

export default function RenameModal({ item, onClose }) {
    const [name, setName] = useState(item.name)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim() || name.trim() === item.name) {
            onClose()
            return
        }
        setLoading(true)
        try {
            if (item.itemType === 'folder') {
                await renameFolder(item._id, name.trim())
            } else {
                await renameFile(item._id, name.trim())
            }
            toast.success('Renamed successfully')
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to rename')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Rename
                </h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <div className="flex justify-end gap-3 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
