import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.log(req, res.statusCode, Date.now() - start).catch(() => {});
        },
        error: (err) => {
          this.log(req, err.status || 500, Date.now() - start).catch(() => {});
        },
      }),
    );
  }

  private async log(req: any, statusCode: number, latencyMs: number) {
    const configId = req.user?.configId;
    if (!configId) return;

    try {
      await this.prisma.apiAccessLog.create({
        data: {
          configId,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          latencyMs,
        },
      });
    } catch {}
  }
}
