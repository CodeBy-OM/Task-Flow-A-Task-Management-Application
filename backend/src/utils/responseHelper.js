/**
 * Standardized API response helpers
 */

const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    if (data && typeof data === 'object' && data.items !== undefined) {
      // Paginated response
      response.data = data.items;
      response.pagination = data.pagination;
    } else {
      response.data = data;
    }
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, items, total, page, limit, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  return successResponse(
    res,
    {
      items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
    message
  );
};

module.exports = { successResponse, errorResponse, paginatedResponse };
