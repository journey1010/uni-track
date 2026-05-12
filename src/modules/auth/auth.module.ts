import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
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

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserSession, Permission, Role]),
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
    ],
    exports: [TokenService],
})
export class AuthModule {}

