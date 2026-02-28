import { HiOutlineX } from 'react-icons/hi'

export default function UploadProgress({ uploads, onClear }) {
    const hasCompleted = uploads.some((u) => u.done || u.error)

    return (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                    Uploading{' '}
                    {uploads.filter((u) => !u.done && !u.error).length} file(s)
                </h4>
                {hasCompleted && (
                    <button
                        onClick={onClear}
                        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                        Clear completed
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 truncate flex-1 min-w-0">
                            {upload.name}
                        </span>
                        <div className="w-32 bg-gray-200 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full transition-all ${
                                    upload.error ? 'bg-red-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${upload.progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 w-9 text-right">
                            {upload.error
                                ? '✗'
                                : upload.done
                                  ? '✓'
                                  : `${upload.progress}%`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
