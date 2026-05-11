import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';

import { User } from '@modules/users/domain/entities/user.entity';
import { UserSession } from '@modules/users/domain/entities/user.session.entity';
import { UserStatus } from '@modules/users/domain/Enums/user.status.enum';
import { Permission } from '@modules/authorization/domain/entities/permission.entity';
import { Result } from '@Common/results';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';

export interface RefreshResult {
    access_token: string;
    refresh_token: string | null;
    name: string;
    last_name: string;
    email: string;
    phone: string;
    permissions: string[];
}

interface SessionMeta {
    ip: string;
    userAgent: string;
}

interface JwtPayload {
    aud: string;
    type: string;
    sub: string;
    jti: string;
    exp: number;
    iat: number;
    vrs?: number;
    level?: number;
    permissions?: string[];
}

interface CachedUser {
    id: string;
    name: string;
    last_name: string;
    email: string;
    phone: string;
    status: number;
    level: number;
    token_version: number;
    permissionCodes: string[];
    permissionNames: string[];
}

@Injectable()
export class RefreshTokenCase {
    private static readonly ROTATION_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
    private static readonly CACHE_TTL_SECONDS = 300; // 5 minutes
    private static readonly CACHE_PREFIX = 'auth:user:';

    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: UserSessionRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: cacheManager.Cache,
    ) {}


    async execute(
        refreshTokenStr: string,
        meta: SessionMeta,
    ): Promise<Result<RefreshResult, string>> {
        // 1. Decode and verify refresh token
        let payload: JwtPayload;
        try {
            payload = this.jwtService.verify<JwtPayload>(refreshTokenStr);
        } catch {
            return Result.failure('Invalid or expired refresh token');
        }

        if (payload.type !== 'refresh') {
            return Result.failure('Token is not a refresh token');
        }

        // 2. Validate session exists and not expired
        const session = await this.sessionRepository.findActiveByJti(
            payload.jti,
            'refresh',
        );

        if (!session) {
            return Result.failure('Session not found or expired');
        }

        // 3. Get user data (from cache or DB), verify active status
        const cachedUser = await this.getCachedUser(payload.sub);
        if (!cachedUser) {
            return Result.failure('User not found');
        }

        if (cachedUser.status !== UserStatus.ACTIVE) {
            return Result.failure('User account is not active');
        }

        // 4. Generate new access token
        const audience = this.configService.get<string>(
            'jwt.audience',
            'local',
        );
        const accessTtl = this.configService.get<number>('jwt.accessTtl', 3600);
        const refreshTtl = this.configService.get<number>(
            'jwt.refreshTtl',
            604800,
        );
        const now = new Date();
        const accessJti = uuidv4();

        const accessToken = this.jwtService.sign(
            {
                aud: audience,
                type: 'access',
                sub: cachedUser.id,
                jti: accessJti,
                vrs: cachedUser.token_version,
                level: cachedUser.level,
                permissions: cachedUser.permissionCodes,
            },
            { expiresIn: accessTtl },
        );

        // Persist access session
        const accessSession = this.sessionRepository.create({
            user_id: cachedUser.id,
            jti: accessJti,
            user_agent: meta.userAgent,
            ip_address: meta.ip,
            expires_at: new Date(now.getTime() + accessTtl * 1000),
            type: 'access',
            last_used_at: now,
        });
        await this.sessionRepository.save(accessSession);

        // 5. Rotation logic: if refresh expires in less than 24h, rotate it
        const expiresAt = session.expires_at.getTime();
        const timeUntilExpiry = expiresAt - now.getTime();
        let newRefreshToken: string | null = null;

        if (timeUntilExpiry < RefreshTokenCase.ROTATION_THRESHOLD_MS) {
            // Rotate: delete old refresh session, create new one
            const refreshJti = uuidv4();

            newRefreshToken = this.jwtService.sign(
                {
                    aud: audience,
                    type: 'refresh',
                    sub: cachedUser.id,
                    jti: refreshJti,
                },
                { expiresIn: refreshTtl },
            );

            // Remove old refresh session
            await this.sessionRepository.deleteById(session.id);

            // Persist new refresh session
            const refreshSession = this.sessionRepository.create({
                user_id: cachedUser.id,
                jti: refreshJti,
                user_agent: meta.userAgent,
                ip_address: meta.ip,
                expires_at: new Date(now.getTime() + refreshTtl * 1000),
                type: 'refresh',
                last_used_at: now,
            });
            await this.sessionRepository.save(refreshSession);
        } else {
            // Update last_used_at on existing refresh session
            session.last_used_at = now;
            await this.sessionRepository.save(session);
        }

        return Result.success({
            access_token: accessToken,
            refresh_token: newRefreshToken,
            name: cachedUser.name,
            last_name: cachedUser.last_name,
            email: cachedUser.email,
            phone: cachedUser.phone,
            permissions: cachedUser.permissionNames,
        });
    }

    /**
     * Get user data from Redis cache or fallback to DB.
     * Caches for 5 minutes to accelerate refresh validations.
     */
    private async getCachedUser(userId: string): Promise<CachedUser | null> {
        const cacheKey = `${RefreshTokenCase.CACHE_PREFIX}${userId}`;

        // Try cache first
        const cached = await this.cacheManager.get<CachedUser>(cacheKey);
        if (cached) {
            return cached;
        }

        // Fallback to DB
        const user = await this.userRepository.findByIdWithPermissions(userId);

        if (!user) {
            return null;
        }

        // Unify permissions
        const permissionMap = new Map<number, Permission>();

        if (user.permissions) {
            for (const perm of user.permissions) {
                permissionMap.set(perm.code, perm);
            }
        }

        if (user.roles) {
            for (const role of user.roles) {
                if (role.permissions) {
                    for (const perm of role.permissions) {
                        permissionMap.set(perm.code, perm);
                    }
                }
            }
        }

        const permissions = Array.from(permissionMap.values());

        const cachedUser: CachedUser = {
            id: user.id,
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            level: user.level,
            token_version: user.token_version,
            permissionCodes: permissions.map((p) => String(p.code)),
            permissionNames: permissions.map((p) => p.name),
        };

        // Cache for 5 minutes (TTL in milliseconds for cache-manager v5+)
        await this.cacheManager.set(
            cacheKey,
            cachedUser,
            RefreshTokenCase.CACHE_TTL_SECONDS * 1000,
        );

        return cachedUser;
    }
}

