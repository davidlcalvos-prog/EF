import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MAX_AVATAR_BASE64_LENGTH,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UserPreferences,
  UserProfile,
} from '@ef/contracts';
import { findMunicipality } from '@ef/common';
import { UserProfileRepository } from './repositories/user-profile.repository';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly profileRepository: UserProfileRepository,
    private readonly preferencesRepository: UserPreferencesRepository,
  ) {}

  async findById(id: string): Promise<UserProfile> {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatarBase64: profile.avatarBase64,
      city: profile.city,
      department: profile.department,
      municipalityCode: profile.municipalityCode,
      createdAt: profile.createdAt,
    };
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    if (dto.name) {
      const updated = await this.profileRepository.updateName(id, dto.name);
      if (!updated) {
        throw new NotFoundException(`User ${id} not found`);
      }
    }
    if (dto.favoritePosition !== undefined) {
      await this.profileRepository.updateFavoritePosition(
        id,
        dto.favoritePosition,
      );
    }
    if (dto.municipalityCode !== undefined) {
      if (dto.municipalityCode === null) {
        await this.profileRepository.updateLocation(id, null);
      } else {
        const municipality = findMunicipality(dto.municipalityCode);
        if (!municipality) {
          throw new BadRequestException(
            `Unknown municipalityCode ${dto.municipalityCode}`,
          );
        }
        await this.profileRepository.updateLocation(id, {
          municipalityCode: municipality.code,
          city: municipality.name,
          department: municipality.department,
          latitude: municipality.lat,
          longitude: municipality.lng,
        });
      }
    }
    if (dto.removeAvatar) {
      await this.profileRepository.updateAvatar(id, null);
    } else if (dto.avatarBase64 !== undefined) {
      if (dto.avatarBase64.trim().length === 0) {
        throw new BadRequestException('avatarBase64 cannot be empty');
      }
      if (dto.avatarBase64.length > MAX_AVATAR_BASE64_LENGTH) {
        throw new BadRequestException(
          `avatarBase64 exceeds the maximum size of ${MAX_AVATAR_BASE64_LENGTH} characters`,
        );
      }
      await this.profileRepository.updateAvatar(id, dto.avatarBase64);
    }
    return this.findById(id);
  }

  getPreferences(userId: string): Promise<UserPreferences> {
    return this.preferencesRepository.findByUserId(userId);
  }

  updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    return this.preferencesRepository.upsert(userId, dto.preferences);
  }
}
