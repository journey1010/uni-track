import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SessionMeta {
    ip: string;
    userAgent: string;
}

/**
 * Decorator to extract session metadata (IP and User Agent) from the request.
 * Specific to Auth module for session management.
 */
export const SessionMeta = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): SessionMeta => {
        const request = ctx.switchToHttp().getRequest();
        
        return {
            ip: request.headers['x-forwarded-for'] || request.ip || 'unknown',
            userAgent: request.headers['user-agent'] || 'unknown',
        };
    },
);
