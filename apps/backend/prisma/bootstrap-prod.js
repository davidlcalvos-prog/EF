/**
 * Bootstrap de PRODUCCIÓN — reemplaza a seed.ts para el primer arranque real.
 *
 * seed.ts NO se corre en producción: tiene contraseñas fijas y públicas (el
 * repo es público), crea datos de demo, y su "admin" es un Empresario — no
 * crea ningún Administrador, que es el único rol que puede dar de alta dueños
 * de cancha. Este script hace exactamente dos cosas, ambas idempotentes:
 *
 *   1. Upsert de los 4 roles del sistema (misma fuente de verdad que seed.ts:
 *      SYSTEM_ROLES_SEED de libs/common — se lee del dist compilado porque la
 *      imagen de producción no tiene ts-node ni los fuentes de libs/).
 *   2. Una cuenta de Administrador desde variables de entorno OBLIGATORIAS
 *      (sin defaults, sin contraseñas inventadas), en el mismo estado que
 *      dejaría el registro normal (bcrypt cost 12 + Profile con alias único).
 *
 * JS plano (CommonJS) a propósito: la imagen se construye con --omit=dev y no
 * trae ts-node. Solo usa dependencias de runtime (@prisma/client,
 * @prisma/adapter-pg, bcrypt). Vive en prisma/ porque los Dockerfiles ya
 * copian esa carpeta a la imagen final.
 *
 * Uso (ver infrastructure/docker/DEPLOY.md para el comando completo del VPS):
 *   BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... node prisma/bootstrap-prod.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

try {
  // Comodidad para correrlo en local; en los contenedores DATABASE_URL ya viene puesta.
  require('dotenv/config');
} catch {
  /* dotenv es opcional acá */
}

/** Mismo coste que BCRYPT_ROUNDS de auth.service.ts — el login compara igual. */
const BCRYPT_ROUNDS = 12;
/** Contraseñas del seed de desarrollo — públicas en el repo, prohibidas acá. */
const FORBIDDEN_PASSWORDS = ['Admin123!', 'Demo123!'];
const MIN_PASSWORD_LENGTH = 12;

/**
 * SYSTEM_ROLES_SEED / SYSTEM_ROLE_NAMES desde el dist compilado de libs/common.
 * En la imagen de cada servicio existe dist/apps/<servicio>/libs/common/...;
 * se busca en cualquiera para que el script funcione en cualquier contenedor.
 */
function loadRolesModule() {
  const distApps = path.join(__dirname, '..', 'dist', 'apps');
  const candidates = fs.existsSync(distApps) ? fs.readdirSync(distApps) : [];
  for (const app of candidates) {
    const modulePath = path.join(
      distApps,
      app,
      'libs',
      'common',
      'src',
      'constants',
      'roles.js',
    );
    if (fs.existsSync(modulePath)) {
      return require(modulePath);
    }
  }
  throw new Error(
    'No se encontró libs/common/src/constants/roles.js en dist/ — compilá el backend primero (nest build).',
  );
}

function fail(message) {
  console.error(`bootstrap-prod: ${message}`);
  process.exit(1);
}

function readAdminConfig() {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!email) {
    fail('Falta BOOTSTRAP_ADMIN_EMAIL. Abortando — nunca se inventa una cuenta.');
  }
  if (!password) {
    fail('Falta BOOTSTRAP_ADMIN_PASSWORD. Abortando — nunca se inventa una contraseña.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`BOOTSTRAP_ADMIN_PASSWORD debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (FORBIDDEN_PASSWORDS.includes(password)) {
    fail(
      'BOOTSTRAP_ADMIN_PASSWORD es una contraseña del seed de desarrollo (pública en el repo). Elegí otra.',
    );
  }
  return {
    email,
    password,
    firstname: (process.env.BOOTSTRAP_ADMIN_FIRSTNAME || 'Admin').trim(),
    lastname: (process.env.BOOTSTRAP_ADMIN_LASTNAME || 'Elite Forge').trim(),
    resetPassword: process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === 'true',
  };
}

/** Mismo algoritmo de alias único que user.repository.ts del auth-service. */
async function buildUniqueAlias(prisma, email, name) {
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

  while (await prisma.profile.findUnique({ where: { alias } })) {
    alias = `${base}_${suffix}`;
    suffix += 1;
  }

  return alias;
}

async function main() {
  const { SYSTEM_ROLES_SEED, SYSTEM_ROLE_NAMES } = loadRolesModule();
  const admin = readAdminConfig();

  if (!process.env.DATABASE_URL) {
    fail('Falta DATABASE_URL.');
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1) Roles del sistema (idempotente — mismo upsert que seed.ts)
    for (const role of SYSTEM_ROLES_SEED) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: { name: role.name, description: role.description },
      });
    }
    console.log(`bootstrap-prod: ${SYSTEM_ROLES_SEED.length} roles del sistema asegurados.`);

    // 2) Cuenta de Administrador
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: SYSTEM_ROLE_NAMES.ADMINISTRADOR },
    });

    const existing = await prisma.user.findUnique({ where: { email: admin.email } });

    if (existing && !admin.resetPassword) {
      console.log(
        `bootstrap-prod: el usuario ${admin.email} ya existe, sin cambios ` +
          '(pasá BOOTSTRAP_ADMIN_RESET_PASSWORD=true para resetear la contraseña).',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, roleId: adminRole.id },
      });
      console.log(
        `bootstrap-prod: contraseña reseteada y rol Administrador asegurado para ${admin.email}.`,
      );
      return;
    }

    // Mismo estado que deja el registro normal: user + profile con alias único.
    const alias = await buildUniqueAlias(
      prisma,
      admin.email,
      `${admin.firstname} ${admin.lastname}`,
    );
    await prisma.user.create({
      data: {
        email: admin.email,
        passwordHash,
        firstname: admin.firstname,
        lastname: admin.lastname,
        roleId: adminRole.id,
        profile: { create: { alias } },
      },
    });
    console.log(`bootstrap-prod: Administrador ${admin.email} creado (alias ${alias}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('bootstrap-prod: error ejecutando el bootstrap:', error);
  process.exit(1);
});
