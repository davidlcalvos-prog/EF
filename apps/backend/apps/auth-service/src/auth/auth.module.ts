import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PasswordResetRepository],
})
export class AuthModule {}
