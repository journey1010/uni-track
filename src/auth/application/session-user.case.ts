import { Result } from '@modules/common/results';
import { UserCache, UserCacheService } from '@modules/auth/domain/services/user-cache.interface';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';
import { TokenService } from '@modules/auth/infrastructure/services/jwt.services';
import { SessionMeta } from '@modules/auth/infrastructure/decorators/session-meta.decorator';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';


export class SessionUser {
    constructor(
        private readonly userCacheService: UserCacheService,
        private readonly sessionRepository: UserSessionRepository,
        private readonly tokenService: TokenService,
    ){}

    public async execute(
        userId: string,
        meta: SessionMeta
    ): Promise<Result<LoginResponseDto, string>> {
        const user = await this.userCacheService.getUserById(userId);
        if (!user) {
            return Result.failure('Credenciales invalidas o cuenta inactiva');
        }
        
        if (user.status !== UserStatus.ACTIVE) {
            return Result.failure('Credenciales invalidas o cuenta inactiva');
        }
    }

    async unifiedPermissions(permissionUser: {name: string, code: number}[]): Promise<{permissionNames: string[], permissionCodes: number[]}>{
        const permissionNames: string[] = [];
        const permissionCodes: number[] = [];

        permissionUser.forEach((p) => {
            permissionCodes.push(p.code);
            permissionNames.push(p.name);
        });   
        return {
            permissionNames,
            permissionCodes,
        };
    }

    async saveSessionMany(){
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
    }
}