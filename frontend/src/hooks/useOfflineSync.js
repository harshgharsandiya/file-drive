import { useState, useEffect, useRef, useCallback } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { getQueue, drainQueue } from '../services/offlineQueue'
import api from '../services/api'

/**
 * Manages the offline queue lifecycle:
 *  - Tracks how many operations are pending
 *  - Auto-drains the queue the moment connectivity is restored
 *  - Exposes manual `drain()` for the UI
 *
 * @returns {{
 *   isOnline:     boolean,
 *   pendingCount: number,
 *   isSyncing:    boolean,
 *   lastSync:     { succeeded: number, failed: number, discarded: number } | null,
 *   drain:        () => Promise<void>
 * }}
 */
export function useOfflineSync() {
    const isOnline = useOnlineStatus()
    const wasOnline = useRef(isOnline)

    const [pendingCount, setPendingCount] = useState(() => getQueue().length)
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSync, setLastSync] = useState(null)

    // Keep pendingCount in sync whenever the queue changes
    useEffect(() => {
        const sync = () => setPendingCount(getQueue().length)
        window.addEventListener('offlinequeue:change', sync)
        return () => window.removeEventListener('offlinequeue:change', sync)
    }, [])

    const drain = useCallback(async () => {
        if (isSyncing) return
        const queue = getQueue()
        if (queue.length === 0) return

        setIsSyncing(true)
        try {
            const result = await drainQueue(api, (_done, total) => {
                setPendingCount(total - _done)
            })
            setLastSync(result)
            setPendingCount(getQueue().length)
        } finally {
            setIsSyncing(false)
        }
    }, [isSyncing])

    // Auto-drain when connectivity is restored
    useEffect(() => {
        if (isOnline && !wasOnline.current) {
            drain()
        }
        wasOnline.current = isOnline
    }, [isOnline, drain])

    return { isOnline, pendingCount, isSyncing, lastSync, drain }
}
