import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    // JwtStrategy consulta a auth-service el estado de sesión por request (2026-09-11).
    MicroservicesClientsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ??
          'ef-dev-secret-change-in-production',
      }),
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  // JwtStrategy se exporta porque AuthProxyController la inyecta para
  // invalidar su caché de estado de sesión tras un cambio de contraseña
  // (build 7). Sin este export el gateway no arrancaba: Nest no resolvía la
  // dependencia en AuthProxyModule (incidente en producción, 2026-09-11).
  exports: [JwtStrategy, JwtAuthGuard, RolesGuard, PassportModule, JwtModule],
})
export class GatewayAuthModule {}
