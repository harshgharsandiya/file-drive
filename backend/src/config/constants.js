const constants = {
    JWT: {
        ACCESS_TOKEN_EXPIRY: '7d',
    },

    OTP: {
        OTP_EXPIRES: '5',
    },

    PERMISSIONS: {
        VIEW: 'view',
        COMMENT: 'comment',
        EDIT: 'edit',
    },

    ITEM_TYPE: {
        FILE: 'file',
        FOLDER: 'folder',
    },

    ACTIVITY_ACTIONS: {
        UPLOAD: 'upload',
        RENAME: 'rename',
        MOVE: 'move',
        DELETE: 'delete',
        RESTORE: 'restore',
        SHARE: 'share',
        PREVIEW: 'preview',
        VERSION: 'version',
    },
}

module.exports = constants
