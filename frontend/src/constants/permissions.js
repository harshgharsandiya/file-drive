/**
 * Frontend Permission System
 *
 * Mirrors the backend permission hierarchy so UI decisions can be made
 * without additional API round-trips.
 *
 * Permission hierarchy (higher includes all lower):
 *   owner > edit > comment > view
 */

export const PERMISSIONS = {
    VIEW: 'view',
    COMMENT: 'comment',
    EDIT: 'edit',
    OWNER: 'owner',
}

export const PERMISSION_LEVELS = {
    view: 1,
    comment: 2,
    edit: 3,
    owner: 4,
}

/**
 * Returns true if `userPermission` satisfies `required`.
 * @param {string|null} userPermission
 * @param {string} required
 * @returns {boolean}
 */
export function hasPermission(userPermission, required) {
    const userLevel = PERMISSION_LEVELS[userPermission] ?? 0
    const requiredLevel = PERMISSION_LEVELS[required] ?? 0
    return userLevel >= requiredLevel
}

/**
 * Actions available at each permission level.
 * Each level inherits all actions from levels below it.
 *
 * Usage:
 *   const actions = ALLOWED_ACTIONS['edit']  // ['preview', 'download', 'rename', ...]
 */
export const ALLOWED_ACTIONS = {
    view: ['preview', 'download'],
    comment: ['preview', 'download'],
    edit: [
        'preview',
        'download',
        'rename',
        'star',
        'duplicate',
        'updateDescription',
        'updateLabels',
    ],
    owner: [
        'preview',
        'download',
        'rename',
        'star',
        'duplicate',
        'updateDescription',
        'updateLabels',
        'move',
        'share',
        'delete',
    ],
}

/**
 * Returns the set of allowed actions for a given permission level.
 * @param {string|null} permission - 'view' | 'comment' | 'edit' | 'owner' | null
 * @returns {Set<string>}
 */
export function getAllowedActions(permission) {
    return new Set(ALLOWED_ACTIONS[permission] || [])
}
