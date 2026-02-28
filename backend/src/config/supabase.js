const { createClient } = require('@supabase/supabase-js')

/**
 * Supabase client
 * Set these env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET_NAME
 */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = process.env.SUPABASE_BUCKET_NAME || 'filedrive'

module.exports = { supabase, BUCKET }
