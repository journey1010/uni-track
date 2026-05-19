import { Injectable } from '@nestjs/common';
import { UserStatus } from '@modules/users/domain/Enums/user.status.enum';
import { Hash } from '@Helpers/Hash';
import { DateTime } from '@config/timezone.config';
import { Result } from '@Common/results';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from '@modules/auth/infrastructure/validation/login.dto';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { SessionMeta } from '../infrastructure/decorators/session-meta.decorator';
import { AuthTokenService } from './services/auth-token.service';

@Injectable()
export class LoginUserCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly authTokenService: AuthTokenService,
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
        const permissionCodes: number[] = [];

        unifiedPermissions.forEach((p) => {
            permissionCodes.push(p.code);
            permissionNames.push(p.name);
        });

        const tokens = await this.authTokenService.generateAndPersistTokens({
            id: user.id,
            token_version: user.token_version,
            level: user.level,
            permissionCodes,
        }, meta);

        const response: LoginResponseDto = {
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            permissions: permissionNames,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
        };

        return Result.success(response);
    }
}