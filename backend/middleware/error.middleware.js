const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

const errorMiddleware = (err, req, res, next) => {
  // Log FULL error details including all properties
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    errno: err.errno,
    sql: err.sql,
    sqlMessage: err.sqlMessage,
    sqlState: err.sqlState,
    index: err.index,
    statusCode: err.statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  };

  // Log complete error details to file
  logger.error('Error occurred:', errorDetails);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors;
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  return errorResponse(res, errors, message, statusCode);
};

module.exports = errorMiddleware;