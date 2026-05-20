import { 
    AccessTokenPayload, 
    RefreshTokenPayload, 
    IJwtService, 
    TokenConfig 
} from "@modules/auth/domain/services/jwt.interface";
import { Injectable } from '@nestjs/common';
import { JwtService} from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DateTime } from '@config/timezone.config';

@Injectable()
export class TokenService implements IJwtService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async generateAuthTokens(
        accessPayload: AccessTokenPayload, 
        refreshPayload: RefreshTokenPayload
    ): Promise<{ access: string; refresh: string }> {
        const [access, refresh] = await Promise.all([
            this.generateAccessToken(accessPayload),
            this.generateRefreshToken(refreshPayload),
        ]);

        return { access, refresh };
    }

    async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
        const expiresIn: number = this.configService.getOrThrow<number>('jwt.accessTtl');
        return this.jwtService.signAsync(payload, { expiresIn });
    }

    async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
        const expiresIn: number = this.configService.getOrThrow<number>('jwt.refreshTtl');
        return this.jwtService.signAsync(payload, { expiresIn });
    }

    async verify<T extends object>(token: string): Promise<T> {
        return this.jwtService.verify<T>(token);
    }

    async needTokenRotation(tokenTtl: number): Promise<boolean> {
        const refreshTtl = this.configService.get<number>('jwt.refreshThreshold')!;
        const now = DateTime.now().toSeconds();
        return tokenTtl > now + refreshTtl ? false: true;
    }
}