import { Injectable } from '@nestjs/common';
import { AccessTokenPayload, RefreshTokenPayload, IJwtService } from "@modules/auth/domain/services/jwt.interface";
import { JwtService} from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService implements IJwtService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    public async generateAuthTokens(
        accessPayload: AccessTokenPayload, 
        refreshPayload: RefreshTokenPayload
    ): Promise<{ access: string; refresh: string }> {
        const accessTtl = this.configService.get<number>('jwt.accessTtl')!;
        const refreshTtl = this.configService.get<number>('jwt.refreshTtl')!;

        const [access, refresh] = await Promise.all([
            this.generateAccessToken(accessPayload, accessTtl),
            this.generateRefreshToken(refreshPayload, refreshTtl),
        ]);

        return { access, refresh };
    }

    public async generateAccessToken(payload: AccessTokenPayload, expiresIn: number): Promise<string> {
        return this.jwtService.signAsync(payload, { expiresIn });
    }

    public async generateRefreshToken(payload: RefreshTokenPayload, expiresIn: number): Promise<string> {
        return this.jwtService.signAsync(payload, { expiresIn });
    }

    public async verify<T extends object>(token: string): Promise<T> {
        return this.jwtService.verify<T>(token);
    }
}