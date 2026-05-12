import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from '@config/app.config';
import jwtConfig from '@config/jwt.config';
import redisConfig from '@config/redis.config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';

import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, jwtConfig, redisConfig],
        }),
        ScheduleModule.forRoot(),
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const redisHost = configService.get<string>('redis.host')!;
                const redisPort = configService.get<number>('redis.port')!;

                return {
                    store: new Keyv({
                        store: new KeyvRedis(`redis://${redisHost}:${redisPort}`),
                    }),
                };
            },

            inject: [ConfigService],
        }),
        DatabaseModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}

