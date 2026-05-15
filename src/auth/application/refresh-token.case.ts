import { Injectable } from '@nestjs/common';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserStatus } from '@modules/users/domain/Enums/user.status.enum';
import { Result } from '@Common/results';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';
import { TokenService } from '@modules/auth/infrastructure/services/jwt.services';
import { AccessTokenPayload, RefreshTokenPayload } from '@modules/auth/domain/services/jwt.interface';
import { SessionMeta } from '../infrastructure/decorators/session-meta.decorator';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { UserCache, UserCacheService, CACHE_USER_SERVICE } from '@modules/auth/domain/services/user-cache.interface';
import { DateTime } from '@config/timezone.config';

@Injectable()
export class RefreshTokenCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: UserSessionRepository,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
        private readonly userCacheService: UserCacheService,
    ) {}

    async execute(
        payload: RefreshTokenPayload & { exp: number },
        meta: SessionMeta,
    ): Promise<Result<LoginResponseDto, string>> {
        const userId = payload.sub;
        const cachedUser = await this.getOrCacheUser(userId);
        
        if (!cachedUser) {
            return Result.failure('User not found');
        }

        if (cachedUser.status !== UserStatus.ACTIVE) {
            return Result.failure('User account is not active');
        }

        const session = await this.sessionRepository.findByJti(payload.jti);

        if (!session) {
            return Result.failure('Session not found or expired');
        }

        // 4. Generate new access token
        const audience = this.configService.get<string>('jwt.audience')!;
        const accessTtl = this.configService.get<number>('jwt.accessTtl')!;
        const refreshTtl = this.configService.get<number>('jwt.refreshTtl')!;
        const jwtThreshold = this.configService.get<number>('jwt.jwtThreshold')!;

        const accessJti = uuidv4();
        const accessPayload: AccessTokenPayload = {
            aud: audience,
            type: 'access',
            sub: cachedUser.id,
            jti: accessJti,
            vrs: cachedUser.token_version,
            level: cachedUser.level,
            permissions: cachedUser.permissionCodes as any, // Cast if needed or fix UserCache interface
        };

        const accessToken = await this.tokenService.generateAccessToken(accessPayload, accessTtl);

        // Persist access session
        const accessSession = this.sessionRepository.create({
            user_id: cachedUser.id,
            jti: accessJti,
            user_agent: meta.userAgent,
            ip_address: meta.ip,
            expires_at: DateTime.now().plus({ hours: accessTtl }).toJSDate(),
            type: 'access',
            last_used_at: DateTime.now().toJSDate(),
        });
        await this.sessionRepository.save(accessSession);

        // 5. Rotation logic: if refresh expires in less than threshold, rotate it
        const now = DateTime.now().toSeconds();
        const timeUntilExpiry = payload.exp - now;
        let newRefreshToken: string | undefined = undefined;

        if (timeUntilExpiry < jwtThreshold) {
            // Rotate: delete old refresh session, create new one
            const refreshJti = uuidv4();
            const refreshPayload: RefreshTokenPayload = {
                aud: audience,
                type: 'refresh',
                sub: cachedUser.id,
                jti: refreshJti,
            };

            newRefreshToken = await this.tokenService.generateRefreshToken(refreshPayload, refreshTtl);

            // Remove old refresh session
            await this.sessionRepository.deleteById(session.id);

            // Persist new refresh session
            const refreshSession = this.sessionRepository.create({
                user_id: cachedUser.id,
                jti: refreshJti,
                user_agent: meta.userAgent,
                ip_address: meta.ip,
                expires_at: DateTime.now().plus({ hours: refreshTtl }).toJSDate(),
                type: 'refresh',
                last_used_at: DateTime.now().toJSDate(),
            });
            await this.sessionRepository.save(refreshSession);
        } else {
            // Update last_used_at on existing refresh session
            session.last_used_at = DateTime.now().toJSDate();
            await this.sessionRepository.save(session);
        }

        return Result.success({
            name: cachedUser.name,
            last_name: cachedUser.last_name,
            email: cachedUser.email,
            phone: cachedUser.phone,
            permissions: cachedUser.permissionNames,
            access_token: accessToken,
            refresh_token: newRefreshToken,
        });
    }

    /**
     * Get user data from UserCacheService or fallback to DB.
     */
    private async getOrCacheUser(userId: string): Promise<UserCache | null> {
        // Try cache first
        const cached = await this.userCacheService.getUserById(userId);
        if (cached) {
            return cached;
        }

        // Fallback to DB
        const user = await this.userRepository.findByIdWithPermissions(userId);

        if (!user) {
            return null;
        }

        // Unify permissions
        const unifiedPermissions = await this.userRepository.getUnifiedPermissions(user.id);
        
        const permissionNames: string[] = [];
        const permissionCodes: string[] = [];

        unifiedPermissions.forEach((p) => {
            permissionCodes.push(p.code);
            permissionNames.push(p.name);
        });

        const userCache: UserCache = {
            id: user.id,
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            level: user.level,
            token_version: user.token_version,
            permissionCodes,
            permissionNames,
        };

        await this.userCacheService.setUser(userCache);

        return userCache;
    }
}

