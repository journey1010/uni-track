import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { User } from '@modules/users/domain/entities/user.entity';
import { UserSession } from '@modules/users/domain/entities/user.session.entity';
import { UserStatus } from '@modules/users/domain/Enums/user.status.enum';
import { Permission } from '@modules/authorization/domain/entities/permission.entity';
import { Hash } from '@Helpers/Hash';
import { Result } from '@Common/results';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from '@modules/auth/infrastructure/validation/login.dto';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';

interface SessionMeta {
    ip: string;
    userAgent: string;
}

@Injectable()
export class LoginUserCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: UserSessionRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    public async execute(dto: LoginDto, meta: SessionMeta): Promise<Result<LoginResponseDto, string>> {
        const user = await this.userRepository.findByEmail(dto.email);

        if (!user || user.status !== UserStatus.ACTIVE) {
            return Result.failure('Credenciales invalidas o cuenta inactiva');
        }

        const passwordValid = await Hash.check(dto.password, user.password);
        if (!passwordValid) {
            return Result.failure('Credenciales invalidas o cuenta inactiva');
        }

        // 3. Unify permissions (no duplicates)
        const unifiedPermissions = this.unifyPermissions(user);

        // 4. Generate tokens
        const accessJti = uuidv4();
        const refreshJti = uuidv4();
        const audience = this.configService.get<string>(
            'jwt.audience',
            'local',
        );
        const accessTtl = this.configService.get<number>('jwt.accessTtl', 3600);
        const refreshTtl = this.configService.get<number>(
            'jwt.refreshTtl',
            604800,
        );

        const permissionCodes = unifiedPermissions.map((p) => String(p.code));

        const accessToken = this.jwtService.sign(
            {
                aud: audience,
                type: 'access',
                sub: user.id,
                jti: accessJti,
                vrs: user.token_version,
                level: user.level,
                permissions: permissionCodes,
            },
            { expiresIn: accessTtl },
        );

        const refreshToken = this.jwtService.sign(
            {
                aud: audience,
                type: 'refresh',
                sub: user.id,
                jti: refreshJti,
            },
            { expiresIn: refreshTtl },
        );

        // 5. Persist sessions
        const now = new Date();

        const accessSession = this.sessionRepository.create({
            user_id: user.id,
            jti: accessJti,
            user_agent: meta.userAgent,
            ip_address: meta.ip,
            expires_at: new Date(now.getTime() + accessTtl * 1000),
            type: 'access',
            last_used_at: now,
        });

        const refreshSession = this.sessionRepository.create({
            user_id: user.id,
            jti: refreshJti,
            user_agent: meta.userAgent,
            ip_address: meta.ip,
            expires_at: new Date(now.getTime() + refreshTtl * 1000),
            type: 'refresh',
            last_used_at: now,
        });

        await this.sessionRepository.saveMany([accessSession, refreshSession]);

        // 6. Build response with permission.name
        const permissionNames = unifiedPermissions.map((p) => p.name);

        const response: LoginResponseDto = {
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            permissions: permissionNames,
            access_token: accessToken,
            refresh_token: refreshToken,
        };

        return Result.success(response);
    }

    /**
     * Unify direct permissions (permission_user) and role-based permissions
     * (role_user → permission_role). Returns deduplicated list by permission.code.
     */
    private unifyPermissions(user: User): Permission[] {
        const permissionMap = new Map<number, Permission>();

        // Direct permissions
        if (user.permissions) {
            for (const perm of user.permissions) {
                permissionMap.set(perm.code, perm);
            }
        }

        // Role-based permissions
        if (user.roles) {
            for (const role of user.roles) {
                if (role.permissions) {
                    for (const perm of role.permissions) {
                        permissionMap.set(perm.code, perm);
                    }
                }
            }
        }

        return Array.from(permissionMap.values());
    }
}

