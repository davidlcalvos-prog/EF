import { Module } from '@nestjs/common';
import { MicroservicesClientsModule } from '../clients/microservices-clients.module';
import { AuthProxyModule } from '../auth/auth-proxy.module';
import { FeedProxyController } from './feed-proxy.controller';
import { FeedProxyService } from './feed-proxy.service';

@Module({
  imports: [MicroservicesClientsModule, AuthProxyModule],
  controllers: [FeedProxyController],
  providers: [FeedProxyService],
})
export class FeedProxyModule {}
