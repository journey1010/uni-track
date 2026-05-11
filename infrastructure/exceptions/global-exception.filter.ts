import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';

import * as fs from 'fs';
import * as path from 'path';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpAdapterHost: HttpAdapterHost,
    ) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const appEnv = this.configService.get<string>('app.env', 'local');

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        const errorDetail = {
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
            method: httpAdapter.getRequestMethod(ctx.getRequest()),
            status: httpStatus,
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

        let responseBody: any;

        if (appEnv === 'local' || appEnv === 'dev') {
            responseBody = {
                statusCode: httpStatus,
                message: errorDetail.message,
                error: errorDetail.class,
                stack: errorDetail.stack,
                path: errorDetail.path,
                timestamp: errorDetail.timestamp,
            };
        } else {
            responseBody = {
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                message: 'Ocurrió un error inesperado',
            };
        }

        httpAdapter.reply(
            ctx.getResponse(),
            responseBody,
            responseBody.statusCode,
        );
    }

    private logToFile(errorDetail: Record<string, unknown>): void {
        try {
            const logsDir = path.join(
                process.cwd(),
                'infrastructure',
                'logs',
            );

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

