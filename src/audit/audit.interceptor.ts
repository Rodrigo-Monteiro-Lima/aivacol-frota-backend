import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        void this.auditService.log({
          method: request.method,
          path: request.originalUrl ?? request.url,
          user: request.user?.nickname ?? null,
          statusCode: response.statusCode,
          durationMs: Date.now() - start,
          timestamp: new Date(),
        });
      }),
    );
  }
}
