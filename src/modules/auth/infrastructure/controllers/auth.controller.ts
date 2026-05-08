import {
    Controller,
    Post,
    Body,
    Req,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import { LoginDto } from '../../infrastructure/validation/login.dto';
import { RefreshDto } from '../../infrastructure/validation/refresh.dto';
import { LoginUserCase } from '../../application/login-user.case';
import { RefreshTokenCase } from '../../application/refresh-token.case';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUserCase: LoginUserCase,
        private readonly refreshTokenCase: RefreshTokenCase,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: express.Request) {
        const meta = {
            ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
        };

        const result = await this.loginUserCase.execute(dto, meta);

        if (!result.ok) {
            throw new UnauthorizedException(result.error);
        }

        return {
            statusCode: HttpStatus.OK,
            message: 'Login successful',
            data: result.value,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshDto, @Req() req: express.Request) {
        const meta = {
            ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
        };

        const result = await this.refreshTokenCase.execute(
            dto.refresh_token,
            meta,
        );

        if (!result.ok) {
            throw new UnauthorizedException(result.error);
        }

        return {
            statusCode: HttpStatus.OK,
            message: 'Token refreshed successfully',
            data: result.value,
        };
    }
}
