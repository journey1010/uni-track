import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Res,
    Headers, 
    Response
} from '@nestjs/common';
import { SessionMeta } from '@modules/auth/infrastructure/decorators/session-meta.decorator';
import { LoginDto } from '@modules/auth/infrastructure/validation/login.dto';
import { LoginUserCase } from '@modules/auth/application/login-user.case';
import { RefreshTokenCase } from '@modules/auth/application/refresh-token.case';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUserCase: LoginUserCase,
        private readonly refreshTokenCase: RefreshTokenCase,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto, 
        @SessionMeta() meta: SessionMeta, 
        @Res() res: Response,
        @Headers('x-client-platform') platform: string
    ) {
        const result = await this.loginUserCase.execute(dto, meta);

        if (!result.ok) {
            throw new UnauthorizedException(result.error);
        }
        
        if(platform !== 'mobile'){
            res.cookie('refresh_token', result.value.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 7,
            });
        }

        return result.value;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@SessionMeta() meta: SessionMeta) {
        const result = await this.refreshTokenCase.execute(
            userId,
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
