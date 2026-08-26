import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ef/database';

/**
 * Forma interna compatible con {@link UserProfile} de @ef/contracts.
 * El mapeo vive en el repositorio para no modificar DTOs ni UsersService.
 */
export interface UserProfileRecord {
  id: string;
  email: string;
  name: string;
  avatarBase64: string | null;
  city: string | null;
  department: string | null;
  municipalityCode: string | null;
  createdAt: Date;
}

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserProfileRecord | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      return null;
    }

    return this.toRecord(profile);
  }

  async updateName(
    userId: string,
    name: string,
  ): Promise<UserProfileRecord | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return null;
    }

    // Equivalente al antiguo user_profiles.name (campo único):
    // persiste el valor completo en users.firstname sin dividir el string.
    await this.prisma.user.update({
      where: { id: userId },
      data: { firstname: name, lastname: '' },
    });

    return this.findById(userId);
  }

  async findFavoritePosition(userId: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { favoritePosition: true },
    });
    return profile?.favoritePosition ?? null;
  }

  async updateFavoritePosition(
    userId: string,
    favoritePosition: string | null | undefined,
  ): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { favoritePosition: favoritePosition ?? null },
    });
  }

  async updateAvatar(
    userId: string,
    avatarBase64: string | null,
  ): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarBase64 },
    });
  }

  /** Fase L.0: escribe la zona resuelta server-side; null limpia todo. */
  async updateLocation(
    userId: string,
    location: {
      municipalityCode: string;
      city: string;
      department: string;
      latitude: number;
      longitude: number;
    } | null,
  ): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: location
        ? { ...location, locationUpdatedAt: new Date() }
        : {
            municipalityCode: null,
            city: null,
            department: null,
            latitude: null,
            longitude: null,
            locationUpdatedAt: new Date(),
          },
    });
  }

  private toRecord(profile: {
    avatarBase64: string | null;
    city: string | null;
    department: string | null;
    municipalityCode: string | null;
    createdAt: Date;
    user: { id: string; email: string; firstname: string; lastname: string };
  }): UserProfileRecord {
    return {
      // BACKEND.md L85: user_profiles.id = user id
      id: profile.user.id,
      email: profile.user.email,
      name: this.formatDisplayName(
        profile.user.firstname,
        profile.user.lastname,
      ),
      avatarBase64: profile.avatarBase64,
      city: profile.city,
      department: profile.department,
      municipalityCode: profile.municipalityCode,
      createdAt: profile.createdAt,
    };
  }

  private formatDisplayName(firstname: string, lastname: string): string {
    return [firstname, lastname]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');
  }
}
