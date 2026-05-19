export interface UserCache {
    id: string;
    name: string;
    last_name: string;
    email: string;
    phone: string;
    status: number;
    level: number;
    token_version: number;
    permissionCodes: number[];
    permissionNames: string[];
}

export const CACHE_USER_SERVICE = 'auth:user:';

export abstract class UserCacheService {
    abstract getUserById(userId: string): Promise<UserCache | null>;
    abstract setUser(user: UserCache): Promise<void>;
    abstract deleteUser(userId: string): Promise<void>;
    abstract getCachedOrFetchUser(userId: string): Promise<UserCache | null>;
}