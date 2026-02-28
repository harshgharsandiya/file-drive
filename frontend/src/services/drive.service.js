import api from './api'

// Folders
export const getRootContents = (params) => api.get('/folders/root', { params })
export const getFolderChildren = (folderId, params) =>
    api.get(`/folders/${folderId}/children`, { params })
export const createFolder = (data) => api.post('/folders', data)
export const renameFolder = (folderId, name) =>
    api.patch(`/folders/${folderId}/rename`, { name })
export const moveFolder = (folderId, parentId) =>
    api.patch(`/folders/${folderId}/move`, { parentId })
export const deleteFolder = (folderId) => api.delete(`/folders/${folderId}`)
export const getFolderPath = (folderId) => api.get(`/folders/${folderId}/path`)
export const getFolderTree = () => api.get('/folders/tree')
export const setFolderColor = (folderId, color) =>
    api.patch(`/folders/${folderId}/color`, { color })
export const toggleFolderStar = (folderId) =>
    api.patch(`/folders/${folderId}/star`)
export const duplicateFolder = (folderId) =>
    api.post(`/folders/${folderId}/duplicate`)

// Files
export const uploadFile = (formData, onProgress) =>
    api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
    })
export const getFile = (fileId) => api.get(`/files/${fileId}`)
export const renameFile = (fileId, name) =>
    api.patch(`/files/${fileId}/rename`, { name })
export const moveFile = (fileId, folderId) =>
    api.patch(`/files/${fileId}/move`, { folderId })
export const deleteFile = (fileId) => api.delete(`/files/${fileId}`)
export const downloadFile = (fileId) => api.get(`/files/${fileId}/download`)
export const previewFile = (fileId) => api.get(`/files/${fileId}/preview`)
export const toggleFileStar = (fileId) => api.patch(`/files/${fileId}/star`)
export const duplicateFile = (fileId) => api.post(`/files/${fileId}/duplicate`)
export const updateDescription = (fileId, description) =>
    api.patch(`/files/${fileId}/description`, { description })
export const updateLabels = (fileId, labels) =>
    api.patch(`/files/${fileId}/labels`, { labels })
export const getRecentFiles = (params) => api.get('/files/recent', { params })
export const getStarredFiles = (params) => api.get('/files/starred', { params })
export const getFilesByType = (category, params) =>
    api.get(`/files/type/${category}`, { params })

// Versions
export const getVersions = (fileId) => api.get(`/files/${fileId}/versions`)
export const restoreVersion = (fileId, versionId) =>
    api.post(`/files/${fileId}/versions/${versionId}/restore`)
export const deleteVersion = (fileId, versionId) =>
    api.delete(`/files/${fileId}/versions/${versionId}`)
export const uploadNewVersion = (fileId, formData, onProgress) =>
    api.post(`/files/${fileId}/upload-version`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
    })

// Shares
export const shareWithUser = (data) => api.post('/shares/user', data)
export const createPublicLink = (data) => api.post('/shares/link', data)
export const getSharedWithMe = (params) =>
    api.get('/shares/with-me', { params })
export const getSharedByMe = (params) => api.get('/shares/by-me', { params })
export const getSharesForItem = (itemId) => api.get(`/shares/item/${itemId}`)
export const updateSharePermission = (shareId, permission) =>
    api.patch(`/shares/${shareId}`, { permission })
export const revokeShare = (shareId) => api.delete(`/shares/${shareId}`)
export const getSharedByToken = (token) => api.get(`/shares/link/${token}`)

// Search
export const search = (params) => api.get('/search', { params })
export const searchSuggest = (q) =>
    api.get('/search/suggest', { params: { q } })

// Trash
export const getTrash = (params) => api.get('/trash', { params })
export const restoreFromTrash = (trashId) =>
    api.post(`/trash/${trashId}/restore`)
export const permanentDelete = (trashId) => api.delete(`/trash/${trashId}`)
export const emptyTrash = () => api.delete('/trash/empty')

// Activity
export const getActivities = (params) => api.get('/activities', { params })

// Notifications
export const getNotifications = (params) =>
    api.get('/notifications', { params })
export const getUnreadCount = () => api.get('/notifications/unread-count')
export const markNotificationRead = (id) =>
    api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = () =>
    api.patch('/notifications/read-all')
export const deleteNotification = (id) => api.delete(`/notifications/${id}`)

// User / Profile
export const getProfile = () => api.get('/user/profile')
export const updateProfile = (data) => api.patch('/user/profile', data)
export const uploadAvatar = (formData) =>
    api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
export const changePassword = (data) => api.post('/user/change-password', data)
export const updatePreferences = (data) => api.patch('/user/preferences', data)
export const getStorageBreakdown = () => api.get('/user/storage')
export const deleteAccount = (data) => api.post('/user/delete-account', data)
export const getMe = () => api.get('/users/me')
