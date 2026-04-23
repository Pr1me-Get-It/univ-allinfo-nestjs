import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch (e) {
  console.error('Failed to create log directory: ' + e);
}

const dailyTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'access-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d', // 한 달 보관
  level: 'info',
});

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    dailyTransport,
    new transports.Console({
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

export default logger;
