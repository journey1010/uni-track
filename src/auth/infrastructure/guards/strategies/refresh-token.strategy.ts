import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenPayload } from '@modules/auth/domain/services/jwt.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    return request?.cookies?.['refresh-token'];
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('jwt.secret'),
            audience: configService.getOrThrow<string>('jwt.audience'),
        });
    }

    async validate(payload: any): Promise<RefreshTokenPayload> {
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException('Invalid token type');
        }
        return payload;
    }
}
