import pino from 'pino';

// this requires pino-pretty to be installed as dev dep
export const logger = pino({
  transport: {
    target: process.env.NODE_ENV === 'production' ? 'pino' : 'pino-pretty',
    // FATAL, ERROR, WARN, INFO, DEBUG, TRACE
    level: process.env.LOG_LEVEL || 'info',
    options: {
      colorize: true,
    },
  },
});
