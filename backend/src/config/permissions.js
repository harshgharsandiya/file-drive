/**
 * RBAC Permission System
 *
 * Permission hierarchy (higher includes lower):
 *   owner > edit > comment > view
 *
 * Mapping of actions to minimum required permission:
 *   - view-only actions: preview, download, getInfo
 *   - comment-level:     addComment, readComments
 *   - edit-level:        rename, star, duplicate, uploadVersion
 *   - owner-only:        delete, move, share, changePermission, permanentDelete
 */

const PERMISSIONS = {
    VIEW: 'view',
    COMMENT: 'comment',
    EDIT: 'edit',
    OWNER: 'owner',
}

const PERMISSION_HIERARCHY = {
    view: 1,
    comment: 2,
    edit: 3,
    owner: 4,
}

/** Actions and the minimum permission level they require */
const ACTION_PERMISSIONS = {
    // Read / View
    getInfo: 'view',
    preview: 'view',
    download: 'view',
    getVersions: 'view',

    // Comment
    addComment: 'comment',

    // Edit
    rename: 'edit',
    star: 'edit',
    duplicate: 'edit',
    uploadVersion: 'edit',
    updateDescription: 'edit',
    updateLabels: 'edit',

    // Owner only
    move: 'owner',
    delete: 'owner',
    share: 'owner',
    revokeShare: 'owner',
    changePermission: 'owner',
}

/**
 * Check if a permission level satisfies the required minimum
 * @param {string} userPermission
 * @param {string} required
 * @returns {boolean}
 */
function hasPermission(userPermission, required) {
    const userLevel = PERMISSION_HIERARCHY[userPermission] ?? 0
    const requiredLevel = PERMISSION_HIERARCHY[required] ?? 0
    return userLevel >= requiredLevel
}

module.exports = {
    PERMISSIONS,
    PERMISSION_HIERARCHY,
    ACTION_PERMISSIONS,
    hasPermission,
}
