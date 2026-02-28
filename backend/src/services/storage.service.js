const { supabase, BUCKET } = require('../config/supabase')

/**
 * Storage service — abstracts all Supabase Storage operations
 */

// Upload a file buffer to Supabase Storage
exports.uploadFile = async (key, buffer, contentType) => {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(key, buffer, {
            contentType,
            upsert: true,
        })

    if (error) throw error
    return data
}

// Generate a signed upload URL (for direct client uploads)
exports.getUploadUrl = async (key, _contentType, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(key)

    if (error) throw error
    // Supabase returns { signedUrl, path, token }
    return data.signedUrl
}

// Generate a signed download URL
exports.getDownloadUrl = async (key, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(key, expiresIn)

    if (error) throw error
    return data.signedUrl
}

// Download file from Supabase Storage
exports.getFileStream = async (key) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(key)

    if (error) throw error

    // Supabase returns a Blob; convert to Buffer
    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return {
        buffer,
        contentType: data.type,
        contentLength: buffer.length,
    }
}

// Delete a file from Supabase Storage
exports.deleteFile = async (key) => {
    const { data, error } = await supabase.storage.from(BUCKET).remove([key])

    if (error) throw error
    return data
}

// Copy a file in Supabase Storage (used for versioning)
exports.copyFile = async (sourceKey, destinationKey) => {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .copy(sourceKey, destinationKey)

    if (error) throw error
    return data
}

// Check if file exists
exports.fileExists = async (key) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(key)

    if (error) return false
    return true
}
