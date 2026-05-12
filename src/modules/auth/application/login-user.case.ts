import { Injectable } from '@nestjs/common';
import { UserStatus } from '@modules/users/domain/Enums/user.status.enum';
import { Hash } from '@Helpers/Hash';
import { DateTime } from '@config/timezone.config';
import { Result } from '@Common/results';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from '@modules/auth/infrastructure/validation/login.dto';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';
import { TokenService } from '@modules/auth/infrastructure/services/jwt.services';
import { AccessTokenPayload, RefreshTokenPayload } from '@modules/auth/domain/services/jwt.interface';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { SessionMeta } from '../infrastructure/decorators/session-meta.decorator';

@Injectable()
export class LoginUserCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: UserSessionRepository,
        private readonly tokenService: TokenService,
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

        const unifiedPermissions = await this.userRepository.getUnifiedPermissions(user.id);
        
        const permissionNames: string[] = [];
        const permissionCodes: string[] = [];

        unifiedPermissions.forEach((p) => {
            permissionCodes.push(p.code);
            permissionNames.push(p.name);
        });

        const audience = this.configService.get<string>('jwt.audience')!;
        const accessTtl = this.configService.get<number>('jwt.accessTtl')!;
        const refreshTtl = this.configService.get<number>('jwt.refreshTtl')!;

        const accessJti = uuidv4();
        const refreshJti = uuidv4();

        const accessPayload: AccessTokenPayload = {
            aud: audience,
            type: 'access',
            sub: user.id,
            jti: accessJti,
            vrs: user.token_version,
            level: user.level,
            permissions: permissionCodes,
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

        const response: LoginResponseDto = {
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            permissions: permissionNames,
            access_token: tokens.access,
            refresh_token: tokens.refresh,
        };

        return Result.success(response);
    }
}