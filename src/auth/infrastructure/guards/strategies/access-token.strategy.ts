import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from '@modules/auth/domain/services/jwt.interface';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret')!,
            audience: configService.get<string>('jwt.audience')!,
        });
    }

    async validate(payload: any): Promise<AccessTokenPayload> {
        if (payload.type !== 'access') {
            throw new UnauthorizedException('Invalid token type');
        }
        return payload;
    }
}
