import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export type PushPlatform = 'ios' | 'android';

export class RegisterPushTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsIn(['ios', 'android'])
  platform!: PushPlatform;
}

export class RegisterPushTokenPayload extends RegisterPushTokenDto {
  @IsUUID()
  userId!: string;
}

/**
 * Sin token: borra todos los del usuario (logout general). Con token: borra
 * solo ese dispositivo. El gateway decide cuál según si el body trae `token`.
 */
export class RemovePushTokenDto {
  @IsOptional()
  @IsString()
  token?: string;
}

export class RemovePushTokenPayload extends RemovePushTokenDto {
  @IsUUID()
  userId!: string;
}
