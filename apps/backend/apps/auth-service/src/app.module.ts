import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@ef/database';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'apps/backend/.env'),
      ],
    }),
    PrismaModule,
    // registerAsync: lee JWT_SECRET tras cargar .env (register() evaluaba process.env demasiado pronto).
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ??
          'ef-dev-secret-change-in-production',
        signOptions: { expiresIn: '7d' as const },
      }),
    }),
    // Correo por SMTP (2026-09-11): lo usa la recuperación de contraseña.
    MailModule,
    AuthModule,
  ],
})
export class AppModule {}
