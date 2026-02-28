import { useState, useEffect } from 'react'

/**
 * Returns a live boolean reflecting `navigator.onLine`.
 * Updates whenever the browser fires the 'online' / 'offline' window events.
 *
 * @returns {boolean}
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)

        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)

        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    return isOnline
}
