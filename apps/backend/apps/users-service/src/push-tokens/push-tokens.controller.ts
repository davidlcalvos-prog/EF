import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@ef/common';
import { RegisterPushTokenPayload, RemovePushTokenPayload } from '@ef/contracts';
import { PushTokensService } from './push-tokens.service';

@Controller()
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @MessagePattern(MESSAGE_PATTERNS.PUSH_TOKENS.REGISTER)
  register(@Payload() data: RegisterPushTokenPayload) {
    return this.pushTokensService.register(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.PUSH_TOKENS.REMOVE)
  remove(@Payload() data: RemovePushTokenPayload) {
    return this.pushTokensService.remove(data);
  }
}
