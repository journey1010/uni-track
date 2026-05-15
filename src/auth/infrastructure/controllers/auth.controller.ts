import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Res,
    Headers,
    Req,
    UseGuards,
} from '@nestjs/common';
import { SessionMeta } from '@modules/auth/infrastructure/decorators/session-meta.decorator';
import { LoginDto } from '@modules/auth/infrastructure/validation/login.dto';
import { LoginUserCase } from '@modules/auth/application/login-user.case';
import { RefreshTokenCase } from '@modules/auth/application/refresh-token.case';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { LoginResponseDto } from '@modules/auth/application/dto/login-response.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUserCase: LoginUserCase,
        private readonly refreshTokenCase: RefreshTokenCase,
        private readonly configService: ConfigService,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto, 
        @SessionMeta() meta: SessionMeta, 
        @Res({ passthrough: true }) res: any,
        @Headers('x-client-platform') platform: string
    ) {
        const result = await this.loginUserCase.execute(dto, meta);

        if (!result.ok) {
            throw new UnauthorizedException(result.error);
        }
        
        const response : LoginResponseDto = result.value!;

        if(platform !== 'mobile'){
            this.setRefreshTokenCookie(res, response.refresh_token!);
            delete response.refresh_token;
        }

        return response;
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: any,
        @SessionMeta() meta: SessionMeta,
        @Res({ passthrough: true }) res: any,
        @Headers('x-client-platform') platform: string
    ) {
        const result = await this.refreshTokenCase.execute(
            req.user,
            meta,
        );

        if (!result.ok) {
            throw new UnauthorizedException(result.error);
        }

        const response: LoginResponseDto = result.value!;

        if(platform !== 'mobile'){
            this.setRefreshTokenCookie(res, response.refresh_token);
            delete response.refresh_token;
        }

        return response;
    }

    private setRefreshTokenCookie(res: any, token: string) {
        const options = {
            httpOnly: true,
            secure: this.configService.get<string>('app.env') === 'production' ? true : false,
            sameSite: 'strict' as const,
            maxAge: this.configService.getOrThrow<number>('jwt.refreshTtl') * 1000,
        };

        if (typeof res.cookie === 'function') {
            res.cookie('refresh-token', token, options);
        } else if (typeof res.setCookie === 'function') {
            res.setCookie('refresh-token', token, options);
        }
    }
}
