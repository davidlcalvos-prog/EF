import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  AllExceptionsFilter,
  globalValidationPipe,
  LoggingInterceptor,
} from '@ef/common';

function resolveCorsOrigins(config: ConfigService): string[] | boolean {
  const raw = config.get<string>('CORS_ORIGINS');
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // Dev por defecto: web Next (5175) + variantes locales
  if (config.get<string>('NODE_ENV') !== 'production') {
    return [
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
  }

  return false;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Default de Express es 100kb — muy chico para la foto de grupo en base64
  // (hasta MAX_GROUP_PHOTO_BASE64_LENGTH ~500KB, ver libs/contracts/src/groups).
  app.useBodyParser('json', { limit: '1mb' });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors({
    origin: resolveCorsOrigins(config),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = config.get<number>('API_GATEWAY_PORT', 3000);
  await app.listen(port);
  console.log(`API Gateway running on http://localhost:${port}/api`);
}

bootstrap();
