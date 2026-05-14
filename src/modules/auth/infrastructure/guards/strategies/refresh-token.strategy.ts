import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../../../domain/services/jwt.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => {
                    return request?.cookies?.refresh_token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret'),
            audience: configService.get<string>('jwt.audience'),
        });
    }

    async validate(payload: any): Promise<RefreshTokenPayload> {
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException('Invalid token type');
        }
        return payload;
    }
}
