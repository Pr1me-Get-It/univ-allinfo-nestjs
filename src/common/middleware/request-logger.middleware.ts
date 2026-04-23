import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const ip =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.getHeader('content-length') || '-';
      const elapsed = Date.now() - start;

      const payload = {
        method,
        url: originalUrl,
        statusCode,
        contentLength: contentLength === '-' ? null : contentLength,
        elapsedMs: elapsed,
        ip,
        userAgent,
      };

      logger.info(payload);
    });

    next();
  }
}
