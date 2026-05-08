import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly configService: ConfigService) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const appEnv = this.configService.get<string>('app.env', 'local');

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        const errorDetail = {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            status,
            message:
                exception instanceof Error
                    ? exception.message
                    : String(message),
            stack: exception instanceof Error ? exception.stack : undefined,
            class:
                exception instanceof Error
                    ? exception.constructor.name
                    : 'UnknownError',
        };

        // Always log to file regardless of environment
        this.logToFile(errorDetail);

        if (appEnv === 'local' || appEnv === 'dev') {
            response.status(status).json({
                statusCode: status,
                message: errorDetail.message,
                error: errorDetail.class,
                stack: errorDetail.stack,
                path: errorDetail.path,
                timestamp: errorDetail.timestamp,
            });
        } else {
            response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Ocurrió un error inesperado',
            });
        }
    }

    private logToFile(errorDetail: Record<string, unknown>): void {
        try {
            const logsDir = path.join(process.cwd(), 'logs');

            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            const logLine = JSON.stringify(errorDetail) + '\n';
            fs.appendFileSync(
                path.join(logsDir, 'errors.log'),
                logLine,
                'utf-8',
            );
        } catch {
            console.error(
                'Failed to write error log to file',
                errorDetail,
            );
        }
    }
}
