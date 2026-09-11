import { ConfigService } from '@nestjs/config';
import { MailService, maskEmail } from './mail.service';
import { renderPasswordResetEmail } from './templates/password-reset.template';

function build(env: Record<string, string> = {}) {
  const config = { get: (key: string) => env[key] } as unknown as ConfigService;
  return new MailService(config);
}

const CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  user: 'soporte@eliteforge.tech',
  password: 'x',
  from: 'Elite Forge <soporte@eliteforge.tech>',
};

describe('MailService', () => {
  test('sin SMTP_* arranca deshabilitado y sendPasswordReset devuelve false sin lanzar', async () => {
    const service = build({});
    service.onModuleInit();
    expect(service.isEnabled()).toBe(false);
    await expect(service.sendPasswordReset('a@b.com', 'https://x/reset?token=t', 30)).resolves.toBe(false);
  });

  test('con SMTP_* manda por el transporte con from/to/subject y el enlace en texto y html', async () => {
    const service = build({});
    const sendMail = jest.fn(async () => ({ messageId: '<id-1>' }));
    service.useTransport({ sendMail }, CONFIG);
    expect(service.isEnabled()).toBe(true);

    const ok = await service.sendPasswordReset('ana@gmail.com', 'https://eliteforge.tech/auth/reset-password?token=abc', 30);
    expect(ok).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const message = sendMail.mock.calls[0][0] as unknown as {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(message.from).toBe(CONFIG.from);
    expect(message.to).toBe('ana@gmail.com');
    expect(message.subject).toContain('Recuperá tu contraseña');
    expect(message.text).toContain('https://eliteforge.tech/auth/reset-password?token=abc');
    expect(message.html).toContain('href="https://eliteforge.tech/auth/reset-password?token=abc"');
    expect(message.html).toContain('30 minutos');
  });

  test('si el SMTP falla, devuelve false y NO lanza (el endpoint responde 200 igual)', async () => {
    const service = build({});
    const sendMail = jest.fn(async () => {
      throw new Error('535 Authentication failed');
    });
    service.useTransport({ sendMail }, CONFIG);
    await expect(service.sendPasswordReset('a@b.com', 'https://x', 30)).resolves.toBe(false);
  });

  test('readConfig: SMTP_SECURE se deriva del puerto si no viene', () => {
    const service = build({
      SMTP_HOST: 'smtp.hostinger.com',
      SMTP_PORT: '465',
      SMTP_USER: 'soporte@eliteforge.tech',
      SMTP_PASSWORD: 'x',
      SMTP_FROM: 'Elite Forge <soporte@eliteforge.tech>',
    });
    service.onModuleInit();
    expect(service.isEnabled()).toBe(true);
  });
});

test('maskEmail no expone el local-part en los logs', () => {
  expect(maskEmail('juan.perez@gmail.com')).toBe('j***@gmail.com');
  expect(maskEmail('sin-arroba')).toBe('***');
});

test('la plantilla escapa el enlace en el HTML', () => {
  const { html } = renderPasswordResetEmail({ resetUrl: 'https://x/?a=1&b="2"', expiresInMinutes: 30 });
  expect(html).toContain('https://x/?a=1&amp;b=&quot;2&quot;');
  expect(html).not.toContain('b="2"');
});
