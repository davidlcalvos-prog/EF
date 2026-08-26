import { Module } from '@nestjs/common';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { GeoController } from './geo.controller';

@Module({
  imports: [AuthProxyModule],
  controllers: [GeoController],
})
export class GeoModule {}
