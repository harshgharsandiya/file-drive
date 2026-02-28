import { hasPermission } from '../constants/permissions'

/**
 * PermissionGate — conditionally renders children based on permission level.
 *
 * @param {string|null}  userPermission  - 'view' | 'comment' | 'edit' | 'owner' | null
 * @param {string}       required        - Minimum required permission
 * @param {boolean}      [isOwner]       - If true, always renders (overrides userPermission)
 * @param {ReactNode}    [fallback]      - Rendered when permission is insufficient (default: null)
 * @param {ReactNode}    children
 *
 * @example
 * <PermissionGate userPermission={share.permission} required="edit">
 *   <RenameButton />
 * </PermissionGate>
 *
 * // With fallback:
 * <PermissionGate userPermission={share.permission} required="owner" fallback={<span>Read-only</span>}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export default function PermissionGate({
    userPermission,
    required,
    isOwner = false,
    fallback = null,
    children,
}) {
    const effectivePermission = isOwner ? 'owner' : userPermission
    if (!hasPermission(effectivePermission, required)) return fallback
    return children
}
