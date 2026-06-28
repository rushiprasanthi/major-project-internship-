import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const output = stack || message;
      return `${timestamp} ${level}: ${output}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'error.log', level: 'error' })]
      : []),
  ],
});

export function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message || err);

  const status = err.status || 500;
  const isInternalError = Boolean(err.code) || status >= 500;
  const message = isInternalError
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
  });
}
