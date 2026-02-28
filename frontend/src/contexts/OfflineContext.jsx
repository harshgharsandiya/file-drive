import { createContext, useContext, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { enqueue, getQueue, clearQueue } from '../services/offlineQueue'

const OfflineContext = createContext(null)

/**
 * OfflineProvider — wraps the app to:
 *   1. Track online/offline status
 *   2. Auto-drain the queue on reconnect
 *   3. Fire toasts for status changes
 *   4. Expose `enqueue`, `pendingCount`, `isSyncing`, `drain`, `clearQueue`
 *      to any descendant via `useOffline()`
 */
export function OfflineProvider({ children }) {
    const { isOnline, pendingCount, isSyncing, lastSync, drain } =
        useOfflineSync()

    const prevOnline = useRef(isOnline)
    const prevSyncing = useRef(isSyncing)

    // ─── Toast notifications ────────────────────────────────────────────────
    useEffect(() => {
        // Went offline
        if (!isOnline && prevOnline.current) {
            toast(
                '⚡ You\'re offline. Mutations will be queued and replayed when you reconnect.',
                {
                    id: 'offline-status',
                    duration: 6000,
                    style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                        fontWeight: 500,
                    },
                }
            )
        }

        // Came back online
        if (isOnline && !prevOnline.current) {
            toast.dismiss('offline-status')
        }

        prevOnline.current = isOnline
    }, [isOnline])

    // Toast after a successful sync completes
    useEffect(() => {
        if (!isSyncing && prevSyncing.current && lastSync) {
            if (lastSync.succeeded > 0) {
                toast.success(
                    `✓ Back online — synced ${lastSync.succeeded} queued operation${lastSync.succeeded > 1 ? 's' : ''}.`,
                    { duration: 4000 }
                )
            } else if (lastSync.failed > 0) {
                toast.error(
                    `Back online, but ${lastSync.failed} operation${lastSync.failed > 1 ? 's' : ''} failed to sync. They remain in the queue.`,
                    { duration: 5000 }
                )
            }
        }
        prevSyncing.current = isSyncing
    }, [isSyncing, lastSync])

    return (
        <OfflineContext.Provider
            value={{
                isOnline,
                pendingCount,
                isSyncing,
                lastSync,
                drain,
                enqueue,
                getQueue,
                clearQueue,
            }}
        >
            {children}
        </OfflineContext.Provider>
    )
}

/**
 * Access the offline queue context from any component.
 * Must be used inside <OfflineProvider>.
 */
export function useOffline() {
    const ctx = useContext(OfflineContext)
    if (!ctx) throw new Error('useOffline must be used inside <OfflineProvider>')
    return ctx
}
