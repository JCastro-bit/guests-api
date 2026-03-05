export function welcomeTemplate(name: string): { subject: string; html: string } {
  return {
    subject: 'Bienvenido a LOVEPOSTAL!',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FAF0E6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF0E6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(45,27,14,0.12);">
        <tr><td style="background-color:#D4714E;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#FAF0E6;font-size:28px;letter-spacing:2px;font-weight:700;">LOVEPOSTAL</h1>
        </td></tr>
        <tr><td style="padding:40px 48px;">
          <h2 style="color:#2D1B0E;font-size:22px;margin-bottom:16px;">Hola, ${name}!</h2>
          <p style="color:#5C4D47;font-size:16px;line-height:1.6;margin-bottom:24px;">
            Tu cuenta ha sido creada exitosamente. Estas a un paso de crear invitaciones digitales
            elegantes para tu boda.
          </p>
          <p style="color:#5C4D47;font-size:16px;line-height:1.6;margin-bottom:32px;">
            Activa tu plan para comenzar a gestionar tus invitados, crear mesas y compartir
            tu invitacion digital con todos.
          </p>
          <div style="text-align:center;">
            <a href="${process.env.APP_URL}"
               style="display:inline-block;background-color:#D4714E;color:#FAF0E6;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
              Ir a mi dashboard
            </a>
          </div>
        </td></tr>
        <tr><td style="background-color:#F5E6D3;padding:24px 48px;text-align:center;">
          <p style="margin:0;color:#8B6A5A;font-size:13px;">
            LOVEPOSTAL - Invitaciones digitales para bodas<br>
            <a href="https://lovepostal.studio" style="color:#D4714E;text-decoration:none;">lovepostal.studio</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
