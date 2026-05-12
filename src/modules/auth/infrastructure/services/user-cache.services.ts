import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache} from '@nestjs/cache-manager';
import { UserCache, UserCacheService } from '@modules/auth/domain/services/user-cache.interface';

@Injectable()
export class UserCacheServiceImpl extends UserCacheService {
    private static readonly CACHE_PREFIX = 'auth:user:';
    private static readonly CACHE_TTL_MS = 60 * 60  * 24 * 1000; // 24 hours

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {
        super();
    }

    public async getUserById(userId: string): Promise<UserCache | null> {
        const cacheKey = `${UserCacheServiceImpl.CACHE_PREFIX}${userId}`;
        const cached = await this.cacheManager.get<UserCache>(cacheKey);
        return cached || null;
    }

    public async setUser(user: UserCache): Promise<void> {
        const cacheKey = `${UserCacheServiceImpl.CACHE_PREFIX}${user.id}`;
        await this.cacheManager.set(cacheKey, user, UserCacheServiceImpl.CACHE_TTL_MS);
    }

    public async deleteUser(userId: string): Promise<void> {
        const cacheKey = `${UserCacheServiceImpl.CACHE_PREFIX}${userId}`;
        await this.cacheManager.del(cacheKey);
    }
}