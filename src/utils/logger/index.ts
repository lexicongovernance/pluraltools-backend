import pino from 'pino';
import pretty from 'pino-pretty';

export const stream = pretty({
  sync: true,
  colorize: true,
});

// have logger use pretty stream in dev mode, else just use default pino
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  process.env.NODE_ENV === 'production' ? undefined : stream,
);
