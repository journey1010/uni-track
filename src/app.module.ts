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
                const redisHost = configService.get<string>('redis.host', '127.0.0.1');
                const redisPort = configService.get<number>('redis.port', 6379);

                return {
                    store: 'memory',
                    ttl: 300 * 1000,
                    max: 1000,
                    // To enable Redis, install and configure:
                    // store: redisStore,
                    // host: redisHost,
                    // port: redisPort,
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

