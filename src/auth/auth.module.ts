import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '@modules/users/domain/entities/user.entity';
import { UserSession } from '@modules/users/domain/entities/user.session.entity';
import { Permission } from '@modules/authorization/domain/entities/permission.entity';
import { Role } from '@modules/authorization/domain/entities/role.entity';

import { AuthController } from './infrastructure/controllers/auth.controller';
import { LoginUserCase } from './application/login-user.case';
import { RefreshTokenCase } from './application/refresh-token.case';
import { SessionCleanupTask } from './application/session-cleanup.task';
import { UserRepository } from '@modules/users/domain/repositories/user.repository';
import { UserSessionRepository } from '@modules/users/domain/repositories/user-session.repository';
import { TokenService } from './infrastructure/services/jwt.services';
import { AuthTokenService } from './application/services/auth-token.service';

import { UserCacheService } from '@modules/auth/domain/services/user-cache.interface';
import { UserCacheServiceImpl } from './infrastructure/services/user-cache.services';
import { AccessTokenStrategy } from './infrastructure/guards/strategies/access-token.strategy';
import { RefreshTokenStrategy } from './infrastructure/guards/strategies/refresh-token.strategy';
import { AccessTokenGuard } from './infrastructure/guards/access-token.guard';
import { RefreshTokenGuard } from './infrastructure/guards/refresh-token.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSession, Permission, Role]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.secret')!,
                signOptions: {
                    audience: configService.get<string>('jwt.audience')!
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        LoginUserCase,
        RefreshTokenCase,
        SessionCleanupTask,
        UserRepository,
        UserSessionRepository,
        TokenService,
        AuthTokenService,
        {
            provide: UserCacheService,
            useClass: UserCacheServiceImpl,
        },
        AccessTokenStrategy,
        RefreshTokenStrategy,
        AccessTokenGuard,
        RefreshTokenGuard,
    ],
    exports: [TokenService, UserCacheService],
})
export class AuthModule {}

