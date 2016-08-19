import * as winston from 'winston';

export type Logger = winston.LoggerInstance;

export const constructor = (
  options?: winston.LoggerOptions,
  silent?: boolean,
  debug?: boolean) => new winston.Logger(options || {
  transports: [
    new winston.transports.Console({
      level: debug ? 'debug' : 'info',
      colorize: true,
      timestamp: true,
      prettyPrint: true,
      silent: silent ? true : false,
    }),
  ],
});
