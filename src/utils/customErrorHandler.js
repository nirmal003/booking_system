/**
 * Custom Error Handler Class
 * Extends built-in Error class to include HTTP status codes
 *
 * @class ErrorHandler
 * @extends {Error}
 */
class ErrorHandler extends Error {
  /**
   * Creates an instance of ErrorHandler
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;