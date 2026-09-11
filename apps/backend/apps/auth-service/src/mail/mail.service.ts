import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { renderPasswordResetEmail } from './templates/password-reset.template';

/**
 * Transporte mínimo que necesita el servicio: permite inyectar un stub en tests
 * sin levantar nodemailer.
 */
export interface MailTransport {
  sendMail(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<{ messageId?: string }>;
}

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

/** Enmascara el destinatario en los logs: j***@gmail.com. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

/**
 * Envío de correos (2026-09-11). Único punto de salida de un mail del backend.
 *
 * - Credenciales SOLO por variables de entorno (SMTP_HOST, SMTP_PORT,
 *   SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM) — nunca en el repo.
 *   Salen por el SMTP de Hostinger con la casilla soporte@eliteforge.tech: el
 *   dominio ya tiene SPF/DKIM/DMARC para Hostinger, así que no hay DNS que tocar.
 * - NUNCA falla en silencio ni hacia el usuario: cada envío loguea "Mail
 *   enviado" o "Mail FALLÓ" (para `docker compose logs auth-service | grep -i
 *   mail`), y `send*` devuelve boolean en vez de lanzar. Quien llama decide;
 *   en recuperación de contraseña el fallo no puede llegar al cliente porque
 *   revelaría que el correo existe.
 * - Sin SMTP_* configurado (dev local), arranca en modo deshabilitado: un
 *   warn al inicio y cada intento loguea el contenido que habría mandado.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transport: MailTransport | null = null;
  private config: MailConfig | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const config = this.readConfig();
    if (!config) {
      this.logger.warn(
        'Mail DESHABILITADO: faltan SMTP_HOST/SMTP_USER/SMTP_PASSWORD/SMTP_FROM. Los correos se loguean en vez de enviarse.',
      );
      return;
    }
    this.config = config;
    if (!this.transport) {
      this.transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.password },
      }) as unknown as Transporter as MailTransport;
    }
    this.logger.log(`Mail habilitado: ${config.host}:${config.port} como ${maskEmail(config.user)}`);
  }

  /** Solo para tests: reemplaza nodemailer por un stub y fija la config. */
  useTransport(transport: MailTransport, config: MailConfig): void {
    this.transport = transport;
    this.config = config;
  }

  isEnabled(): boolean {
    return this.transport !== null && this.config !== null;
  }

  /**
   * Correo de recuperación de contraseña. `resetUrl` ya trae el token; el
   * cuerpo no incluye nombre ni datos personales (un buzón con typo puede ser
   * de otra persona). Devuelve true si el SMTP lo aceptó.
   */
  async sendPasswordReset(to: string, resetUrl: string, expiresInMinutes: number): Promise<boolean> {
    const { subject, text, html } = renderPasswordResetEmail({ resetUrl, expiresInMinutes });
    return this.send('password-reset', to, subject, text, html);
  }

  private async send(
    template: string,
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<boolean> {
    if (!this.transport || !this.config) {
      this.logger.warn(
        `Mail NO enviado (SMTP deshabilitado): plantilla ${template} a ${maskEmail(to)} — asunto "${subject}"\n${text}`,
      );
      return false;
    }
    try {
      const info = await this.transport.sendMail({
        from: this.config.from,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(
        `Mail enviado: plantilla ${template} a ${maskEmail(to)}, messageId ${info.messageId ?? '?'}`,
      );
      return true;
    } catch (error) {
      // Rastro obligatorio: el endpoint que llama responde 200 igual
      // (anti-enumeración), así que este log es la única pista de que el
      // correo no salió (SMTP caído, contraseña rotada en hPanel → 535, etc.).
      this.logger.error(
        `Mail FALLÓ: plantilla ${template} a ${maskEmail(to)} — ${String(error)}`,
      );
      return false;
    }
  }

  private readConfig(): MailConfig | null {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const from = this.configService.get<string>('SMTP_FROM');
    if (!host || !user || !password || !from) return null;
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '465');
    const secureRaw = this.configService.get<string>('SMTP_SECURE');
    const secure = secureRaw === undefined ? port === 465 : secureRaw === 'true';
    return { host, port, secure, user, password, from };
  }
}
