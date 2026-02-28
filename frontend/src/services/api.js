import axios from 'axios'
import { enqueue } from './offlineQueue'

const api = axios.create({
    baseURL: '/api',
})

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ─── Response interceptor ────────────────────────────────────────────────────
// 1. 401 → force logout
// 2. Network error while OFFLINE + mutation (non-upload) → enqueue for later
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Force logout on expired / invalid token
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            return Promise.reject(error)
        }

        // No response = network error.  If we're offline and this is a
        // lightweight mutation (no file binary), save it for later replay.
        if (!error.response && !navigator.onLine) {
            const config = error.config || {}
            const method = config.method?.toLowerCase()
            const isMutation = ['post', 'patch', 'put', 'delete'].includes(method)
            const isUpload =
                config.data instanceof FormData ||
                (config.headers?.['Content-Type'] || '')
                    .includes('multipart')

            if (isMutation && !isUpload && config.url) {
                // Parse body back to object if axios serialised it to a string
                let body = config.data
                if (typeof body === 'string') {
                    try { body = JSON.parse(body) } catch { body = undefined }
                }

                enqueue({
                    method,
                    url: config.url,
                    data: body,
                    label: `${method.toUpperCase()} ${config.url}`,
                })

                // Resolve with a sentinel so callers know it was queued
                // rather than crashing the UI.
                return Promise.resolve({
                    data: { queued: true, message: 'Saved offline — will sync when reconnected.' },
                    queued: true,
                })
            }
        }

        return Promise.reject(error)
    }
)

export default api
