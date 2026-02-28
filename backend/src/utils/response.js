/**
 * Standardized API response helpers
 */

exports.success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    })
}

exports.error = (
    res,
    message = 'Something went wrong',
    statusCode = 500,
    errors = null
) => {
    const response = {
        success: false,
        message,
    }
    if (errors) response.errors = errors
    return res.status(statusCode).json(response)
}

exports.paginated = (res, data, page, limit, total) => {
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    })
}
