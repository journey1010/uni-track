import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache} from '@nestjs/cache-manager';
import { UserCache, UserCacheService } from '@modules/auth/domain/services/user-cache.interface';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { UserStatus } from '@modules/users/domain/Enums/user.status.enum';

@Injectable()
export class UserCacheServiceImpl extends UserCacheService {
    private static readonly CACHE_PREFIX = 'auth:user:';
    private static readonly CACHE_TTL_MS = 60 * 60  * 24 * 1000; // 24 hours

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        private readonly userRepository: UserRepository,
    ) {
        super();
    }

    async getUserById(userId: string): Promise<UserCache | null> {
        const cacheKey = `${UserCacheServiceImpl.CACHE_PREFIX}${userId}`;
        const cached = await this.cacheManager.get<UserCache>(cacheKey);
        return cached || null;
    }

    async setUser(user: UserCache): Promise<void> {
        const cacheKey = `${UserCacheServiceImpl.CACHE_PREFIX}${user.id}`;
        await this.cacheManager.set(cacheKey, user, UserCacheServiceImpl.CACHE_TTL_MS);
    }

    async deleteUser(userId: string): Promise<void> {
        const cacheKey = `${UserCacheServiceImpl.CACHE_PREFIX}${userId}`;
        await this.cacheManager.del(cacheKey);
    }

    async getCachedOrFetchUser(userId: string): Promise<UserCache | null> {
        let cachedUser = await this.getUserById(userId);

        if (!cachedUser) {
            const user = await this.userRepository.findById(userId);

            if (!user || user.status !== UserStatus.ACTIVE) {
                return null;
            }

            const unifiedPermissions = await this.userRepository.getUnifiedPermissions(user.id);

            const permissionNames: string[] = [];
            const permissionCodes: number[] = [];

            unifiedPermissions.forEach((p) => {
                permissionCodes.push(p.code);
                permissionNames.push(p.name);
            });

            cachedUser = {
                id: user.id,
                name: user.name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                permissionNames,
                permissionCodes,
                token_version: user.token_version,
                level: user.level,
                status: user.status,
            };

            await this.setUser(cachedUser);
        }

        return cachedUser;
    }
}