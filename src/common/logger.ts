import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch (e) {
  // ignore
}

const dailyTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'access-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d', // 보관 기간: 30일 (한 달)
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
