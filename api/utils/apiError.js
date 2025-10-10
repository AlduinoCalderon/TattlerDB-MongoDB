/**
 * Custom API Error class with status codes
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Create a not found error
   * @param {string} message - Error message
   * @returns {ApiError} - Not found error
   */
  static notFound(message) {
    return new ApiError(message, 404);
  }
  
  /**
   * Create a bad request error
   * @param {string} message - Error message
   * @returns {ApiError} - Bad request error
   */
  static badRequest(message) {
    return new ApiError(message, 400);
  }
  
  /**
   * Create an internal server error
   * @param {string} message - Error message
   * @returns {ApiError} - Internal server error
   */
  static internal(message) {
    return new ApiError(message, 500);
  }
  
  /**
   * Create an unauthorized error
   * @param {string} message - Error message
   * @returns {ApiError} - Unauthorized error
   */
  static unauthorized(message) {
    return new ApiError(message, 401);
  }
  
  /**
   * Create a forbidden error
   * @param {string} message - Error message
   * @returns {ApiError} - Forbidden error
   */
  static forbidden(message) {
    return new ApiError(message, 403);
  }
}

module.exports = ApiError;