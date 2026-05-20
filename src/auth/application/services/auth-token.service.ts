import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from '@config/timezone.config';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';
import { TokenService } from '@modules/auth/infrastructure/services/jwt.services';
import { AccessTokenPayload, RefreshTokenPayload } from '@modules/auth/domain/services/jwt.interface';
import { SessionMeta } from '@modules/auth/infrastructure/decorators/session-meta.decorator';

export interface TokenUserData {
    id: string;
    token_version: number;
    level: number;
    permissionCodes: number[];
}

export interface TokenConfig {
    audience: string;
    accessTtl: number;
    refreshTtl: number;
    tokenRotationThreshold: number;
}

@Injectable()
export class AuthTokenService {

    constructor(
        private readonly configService: ConfigService,
        private readonly tokenService: TokenService,
        private readonly sessionRepository: UserSessionRepository,
    ) {}

    /**
     * Generate and persist access and refresh tokens with their sessions
     */
    public async generateAndPersistTokens(
        user: TokenUserData,
        meta: SessionMeta,
    ): Promise<{ access_token: string; refresh_token: string }> {
        const accessJti: string = uuidv4();
        const refreshJti: string = uuidv4();

        const accessPayload: AccessTokenPayload = {
            aud: audience,
            type: 'access',
            sub: user.id,
            jti: accessJti,
            vrs: user.token_version,
            level: user.level,
            permissions: user.permissionCodes,
        };

        const refreshPayload: RefreshTokenPayload = {
            aud: audience,
            type: 'refresh',
            sub: user.id,
            jti: refreshJti,
        };

        const tokens = await this.tokenService.generateAuthTokens(accessPayload, refreshPayload);

        const accessSession = this.sessionRepository.create({
            user_id: user.id,
            jti: accessJti,
            user_agent: meta.userAgent,
            ip_address: meta.ip,
            expires_at: DateTime.now().plus({ hours: accessTtl }).toJSDate(),
            type: 'access',
            last_used_at: DateTime.now().toJSDate(),
        });

        const refreshSession = this.sessionRepository.create({
            user_id: user.id,
            jti: refreshJti,
            user_agent: meta.userAgent,
            ip_address: meta.ip,
            expires_at: DateTime.now().plus({ hours: refreshTtl }).toJSDate(),
            type: 'refresh',
            last_used_at: DateTime.now().toJSDate(),
        });

        await this.sessionRepository.saveMany([accessSession, refreshSession]);

        return {
            access_token: tokens.access,
            refresh_token: tokens.refresh,
        };
    }

    public async refreshAuthTokens(
        user: TokenUserData,
        meta: SessionMeta,
        expiresAt: number,
    ): Promise<{ access_token: string; refresh_token?: string }> {
        const { audience, accessTtl, refreshTtl, tokenRotationThreshold } = this.getTokenConfig();
        const needsRotation = this.shouldRotateRefreshToken(expiresAt);

        const accessJti = uuidv4();
        const accessPayload: AccessTokenPayload = {
            aud: audience,
            type: 'access',
            sub: user.id,
            jti: accessJti,
            vrs: user.token_version,
            level: user.level,
            permissions: user.permissionCodes,
        };

        if (needsRotation) {
            const refreshJti = uuidv4();
            const refreshPayload: RefreshTokenPayload = {
                aud: audience,
                type: 'refresh',
                sub: user.id,
                jti: refreshJti,
            };

            // Generate both tokens concurrently
            const tokens = await this.tokenService.generateAuthTokens(accessPayload, refreshPayload);

            const accessSession = this.sessionRepository.create({
                user_id: user.id,
                jti: accessJti,
                user_agent: meta.userAgent,
                ip_address: meta.ip,
                expires_at: DateTime.now().plus({ hours: accessTtl }).toJSDate(),
                type: 'access',
                last_used_at: DateTime.now().toJSDate(),
            });

            const refreshSession = this.sessionRepository.create({
                user_id: user.id,
                jti: refreshJti,
                user_agent: meta.userAgent,
                ip_address: meta.ip,
                expires_at: DateTime.now().plus({ hours: refreshTtl }).toJSDate(),
                type: 'refresh',
                last_used_at: DateTime.now().toJSDate(),
            });

            // Save both sessions in a single concurrent batch insert query
            await this.sessionRepository.saveMany([accessSession, refreshSession]);

            return {
                access_token: tokens.access,
                refresh_token: tokens.refresh,
            };
        } else {
            // Generate access token and save session
            const accessToken = await this.tokenService.generateAccessToken(accessPayload, accessTtl);

            const accessSession = this.sessionRepository.create({
                user_id: user.id,
                jti: accessJti,
                user_agent: meta.userAgent,
                ip_address: meta.ip,
                expires_at: DateTime.now().plus({ hours: accessTtl }).toJSDate(),
                type: 'access',
                last_used_at: DateTime.now().toJSDate(),
            });

            await this.sessionRepository.save(accessSession);

            return {
                access_token: accessToken,
            };
        }
    }

    public shouldRotateRefreshToken(expiresAt: number): boolean {
        const now = DateTime.now().toSeconds();
        const timeUntilExpiry = expiresAt - now;

        return timeUntilExpiry < this.TOKEN_ROTATION_THRESHOLD;
    }
}
