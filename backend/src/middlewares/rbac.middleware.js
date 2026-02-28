/**
 * RBAC Middleware
 *
 * Enforces Role-Based Access Control on file and folder routes.
 *
 * Usage in routes:
 *   router.patch('/:fileId/rename', auth, requirePermission('edit'), c.renameFile)
 *   router.get('/:fileId/preview', auth, requirePermission('view'), c.previewFile)
 *   router.delete('/:fileId', auth, requirePermission('owner'), c.deleteFile)
 *
 * After this middleware runs, the following are set on req:
 *   req.isOwner         {boolean}       - true if the authenticated user owns the item
 *   req.sharePermission {string|null}   - the share permission level if shared with user
 */

const File = require('../models/file.model')
const Folder = require('../models/folder.model')
const Share = require('../models/share.model')
const AppError = require('../utils/AppError')
const { PERMISSION_HIERARCHY } = require('../config/permissions')

/**
 * Determine param key holding the resource ID
 * Looks for fileId → folderId → itemId in req.params
 */
function resolveItemId(req, paramKey) {
    if (paramKey) return req.params[paramKey]
    return req.params.fileId || req.params.folderId || req.params.itemId || null
}

/**
 * Determine the Mongoose model to use for ownership check
 */
function resolveModel(req, paramKey) {
    if (paramKey === 'folderId') return Folder
    if (paramKey === 'fileId') return File
    // Infer from available params
    if (req.params.folderId) return Folder
    return File
}

/**
 * RBAC middleware factory
 *
 * @param {string} minPermission  - 'view' | 'comment' | 'edit' | 'owner'
 * @param {string} [paramKey]     - Override for the route param holding the resource ID
 *                                  Defaults to auto-detection from req.params
 * @returns {Function} Express middleware
 */
function requirePermission(minPermission = 'view', paramKey = null) {
    return async (req, res, next) => {
        try {
            const userId = req.user.id.toString()
            const itemId = resolveItemId(req, paramKey)

            // If no item ID (e.g., list routes), skip RBAC
            if (!itemId) {
                req.isOwner = true
                req.sharePermission = null
                return next()
            }

            const Model = resolveModel(req, paramKey)

            // Fetch only the ownership field for efficiency
            const item = await Model.findOne({
                _id: itemId,
                isDeleted: false,
            }).select('ownerId')

            if (!item) {
                return next(new AppError('Item not found', 404))
            }

            // ─── Owner: unrestricted access ──────────────────────────────
            if (item.ownerId.toString() === userId) {
                req.isOwner = true
                req.sharePermission = null
                return next()
            }

            // ─── Owner-only actions cannot be delegated ───────────────────
            if (minPermission === 'owner') {
                return next(
                    new AppError('Only the owner can perform this action', 403)
                )
            }

            // ─── Check Share record ───────────────────────────────────────
            const share = await Share.findOne({
                itemId,
                sharedWith: userId,
                $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
            })

            if (!share) {
                return next(
                    new AppError(
                        'Access denied. You do not have permission to access this item.',
                        403
                    )
                )
            }

            const userLevel = PERMISSION_HIERARCHY[share.permission] ?? 0
            const minLevel = PERMISSION_HIERARCHY[minPermission] ?? 0

            if (userLevel < minLevel) {
                return next(
                    new AppError(
                        `Insufficient permission. '${share.permission}' access does not allow this action. ` +
                            `'${minPermission}' or higher is required.`,
                        403
                    )
                )
            }

            req.isOwner = false
            req.sharePermission = share.permission
            next()
        } catch (err) {
            next(err)
        }
    }
}

module.exports = { requirePermission }
