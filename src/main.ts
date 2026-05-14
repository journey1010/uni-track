import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@Exceptions/global-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);

    app.setGlobalPrefix('api');

    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(
        new GlobalExceptionFilter(configService, httpAdapterHost),
    );

    const port = configService.get<number>('app.port', 3000);
    await app.listen(port);
}
bootstrap();

