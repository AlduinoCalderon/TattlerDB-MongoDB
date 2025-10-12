/**
 * Custom API error class to handle HTTP status codes
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static badRequest(message = 'Bad request') {
    return new ApiError(message, 400);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, 500);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }
}

module.exports = ApiError;