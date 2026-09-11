/**
 * Plantilla del correo de recuperación (2026-09-11). Tablas + estilos inline a
 * propósito: Gmail ignora <style> en el body y no soporta flex/grid; el botón
 * es un <a> con padding (sin <button>) y se repite la URL en texto para que
 * el enlace sobreviva a clientes que quitan estilos. Colores de la marca:
 * carbón #1a1a1a, tarjeta #363636, borde #555555, esmeralda #00CEC8, naranja #FF8C00.
 */
export interface PasswordResetEmailInput {
  resetUrl: string;
  expiresInMinutes: number;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPasswordResetEmail({
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): RenderedEmail {
  const subject = 'Recuperá tu contraseña de Elite Forge';
  const url = escapeHtml(resetUrl);

  const text = [
    'Elite Forge — Recuperá tu contraseña',
    '',
    'Recibimos un pedido para cambiar la contraseña de tu cuenta.',
    `Abrí este enlace para elegir una nueva (vence en ${expiresInMinutes} minutos):`,
    '',
    resetUrl,
    '',
    'Si no lo pediste vos, ignorá este correo: tu contraseña no cambia.',
    '',
    'Elite Forge · eliteforge.tech',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1a1a;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#363636;border:1px solid #555555;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:0;height:3px;line-height:3px;font-size:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="50%" style="background-color:#00CEC8;height:3px;line-height:3px;font-size:0;">&nbsp;</td>
                <td width="50%" style="background-color:#FF8C00;height:3px;line-height:3px;font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#00CEC8;font-weight:bold;">Elite Forge</p>
            <h1 style="margin:0;font-size:24px;line-height:30px;color:#FFFFFF;font-weight:bold;font-style:italic;text-transform:uppercase;">Recuperá tu contraseña</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#DDDDDD;">
            <p style="margin:0 0 16px 0;">Recibimos un pedido para cambiar la contraseña de tu cuenta. Tocá el botón para elegir una nueva.</p>
            <p style="margin:0 0 24px 0;color:#AAAAAA;font-size:14px;">El enlace vence en <strong style="color:#FFFFFF;">${expiresInMinutes} minutos</strong> y sirve una sola vez.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="background-color:#00CEC8;border-radius:12px;">
                  <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#1a1a1a;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Elegir nueva contraseña</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#AAAAAA;">
            <p style="margin:0 0 8px 0;">Si el botón no funciona, copiá este enlace en el navegador:</p>
            <p style="margin:0;word-break:break-all;"><a href="${url}" style="color:#00CEC8;text-decoration:underline;">${url}</a></p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px 32px;border-top:1px solid #555555;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#888888;">
            <p style="margin:0 0 6px 0;">Si no pediste cambiar la contraseña, ignorá este correo: tu contraseña no cambia.</p>
            <p style="margin:0;">Elite Forge · <a href="https://eliteforge.tech" style="color:#888888;text-decoration:underline;">eliteforge.tech</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
