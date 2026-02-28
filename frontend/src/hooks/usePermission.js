import { useMemo } from 'react'
import { getAllowedActions, hasPermission } from '../constants/permissions'

/**
 * Hook for checking permissions in components.
 *
 * @param {string|null}  sharePermission - Share permission level: 'view' | 'comment' | 'edit'
 * @param {boolean}      isOwner         - Whether the current user owns the item
 * @returns {{ can: Function, atLeast: Function, permission: string|null }}
 *
 * @example
 * const { can, atLeast } = usePermission(share.permission, isOwner)
 * if (can('rename'))   { ... }   // exact action check
 * if (atLeast('edit')) { ... }   // permission level check
 */
export function usePermission(sharePermission, isOwner = false) {
    const effectivePermission = isOwner ? 'owner' : sharePermission || null

    const allowedActions = useMemo(
        () => getAllowedActions(effectivePermission),
        [effectivePermission]
    )

    /**
     * Check if a specific action is permitted.
     * @param {string} action
     * @returns {boolean}
     */
    const can = (action) => allowedActions.has(action)

    /**
     * Check if the user's permission is at least the given level.
     * @param {string} required - 'view' | 'comment' | 'edit' | 'owner'
     * @returns {boolean}
     */
    const atLeast = (required) => hasPermission(effectivePermission, required)

    return { can, atLeast, permission: effectivePermission }
}
