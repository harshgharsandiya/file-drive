/**
 * Offline Queue — persists pending API mutations to localStorage.
 * Each entry is replayed in order when the client comes back online.
 *
 * Queue item shape:
 * {
 *   id:        string   — unique id (crypto.randomUUID)
 *   method:    string   — 'post' | 'patch' | 'put' | 'delete'
 *   url:       string   — API path, e.g. '/folders/abc123/rename'
 *   data:      object   — request body (no FormData / binary)
 *   label:     string   — human-readable description shown in the UI
 *   timestamp: number   — Date.now() when queued
 *   retries:   number   — how many failed replay attempts so far
 * }
 */

const QUEUE_KEY = 'filedrive_offline_queue'

// ─── Persistence helpers ────────────────────────────────────────────────────

function loadQueue() {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    } catch {
        return []
    }
}

function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    // Notify all listeners (React hooks, etc.) that the queue changed
    window.dispatchEvent(new Event('offlinequeue:change'))
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Add a mutation to the offline queue.
 * @param {{ method, url, data, label }} item
 * @returns {object} The queued entry (with generated id + timestamp)
 */
export function enqueue(item) {
    const queue = loadQueue()
    const entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retries: 0,
        ...item,
    }
    queue.push(entry)
    saveQueue(queue)
    return entry
}

/**
 * Return a copy of the current queue (read-only).
 * @returns {Array}
 */
export function getQueue() {
    return loadQueue()
}

/**
 * Remove a single entry from the queue by id.
 * @param {string} id
 */
export function removeFromQueue(id) {
    saveQueue(loadQueue().filter((item) => item.id !== id))
}

/**
 * Wipe the entire queue.
 */
export function clearQueue() {
    saveQueue([])
}

// ─── Drain (replay) ──────────────────────────────────────────────────────────

/**
 * Attempt to replay every queued request in FIFO order.
 *
 * Rules:
 *   - On success        → remove from queue
 *   - On 4xx response   → discard (request is invalid, no point retrying)
 *   - On 5xx / timeout  → leave in queue, increment retries
 *   - Stops immediately if the device goes offline mid-drain
 *
 * @param {import('axios').AxiosInstance} axiosInstance
 * @param {(done: number, total: number) => void} [onProgress]
 * @returns {Promise<{ succeeded: number, failed: number, discarded: number }>}
 */
export async function drainQueue(axiosInstance, onProgress) {
    const snapshot = loadQueue()
    if (snapshot.length === 0) return { succeeded: 0, failed: 0, discarded: 0 }

    let succeeded = 0
    let failed = 0
    let discarded = 0

    for (const item of snapshot) {
        // Stop mid-drain if we lost connectivity again
        if (!navigator.onLine) break

        try {
            await axiosInstance({
                method: item.method,
                url: item.url,
                data: item.data ?? undefined,
            })
            removeFromQueue(item.id)
            succeeded++
        } catch (err) {
            if (err.response) {
                if (err.response.status < 500) {
                    // 4xx — discard, no point retrying
                    removeFromQueue(item.id)
                    discarded++
                } else {
                    // 5xx — leave in queue, bump retries
                    saveQueue(
                        loadQueue().map((q) =>
                            q.id === item.id
                                ? { ...q, retries: q.retries + 1 }
                                : q
                        )
                    )
                    failed++
                }
            } else {
                // Network error — leave in queue
                saveQueue(
                    loadQueue().map((q) =>
                        q.id === item.id
                            ? { ...q, retries: q.retries + 1 }
                            : q
                    )
                )
                failed++
            }
        }

        onProgress?.(succeeded + failed + discarded, snapshot.length)
    }

    return { succeeded, failed, discarded }
}
