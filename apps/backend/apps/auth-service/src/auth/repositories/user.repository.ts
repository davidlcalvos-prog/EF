import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@ef/database';
import { resolvePublicRegistrationRole } from '../registration-role.resolver';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  registrationRole?: string;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  estado: boolean;
}

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    return user ? this.toAuthUserRecord(user) : null;
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return user ? this.toAuthUserRecord(user) : null;
  }

  async create(data: CreateUserData): Promise<AuthUserRecord> {
    const roleName = resolvePublicRegistrationRole(data.registrationRole);
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      // El detalle es una instrucción interna — va al log, nunca al usuario.
      this.logger.error(
        `System role "${roleName}" is missing from the roles table. ` +
          'Run prisma/bootstrap-prod.js (prod) or npm run prisma:seed (dev).',
      );
      throw new InternalServerErrorException(
        'El registro no está disponible en este momento, intentá más tarde.',
      );
    }

    const alias = await this.buildUniqueAlias(data.email, data.name);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstname: data.name,
        lastname: '',
        roleId: role.id,
        profile: {
          create: { alias },
        },
      },
      include: { role: true },
    });

    return this.toAuthUserRecord(user);
  }

  private async buildUniqueAlias(email: string, name: string): Promise<string> {
    const raw =
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '') ||
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

    const base = (raw || 'user').slice(0, 24);
    let alias = base;
    let suffix = 1;

    while (await this.prisma.profile.findUnique({ where: { alias } })) {
      alias = `${base}_${suffix}`;
      suffix += 1;
    }

    return alias;
  }

  private toAuthUserRecord(user: {
    id: string;
    email: string;
    passwordHash: string;
    firstname: string;
    lastname: string;
    estado: boolean;
    role: { name: string };
  }): AuthUserRecord {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: [user.firstname, user.lastname]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' '),
      role: user.role.name,
      estado: user.estado,
    };
  }
}
