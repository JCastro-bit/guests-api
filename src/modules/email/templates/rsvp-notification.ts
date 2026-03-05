export function rsvpNotificationTemplate(
  coupleName: string,
  guestName: string,
  status: 'confirmed' | 'declined',
  invitationName: string
): { subject: string; html: string } {
  const statusLabel = status === 'confirmed' ? 'confirmo asistencia' : 'declino la invitacion';
  const statusColor = status === 'confirmed' ? '#4A7C59' : '#C0392B';

  return {
    subject: `${guestName} ${statusLabel} — ${invitationName}`,
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
          <h2 style="color:#2D1B0E;font-size:20px;margin-bottom:16px;">Actualizacion de RSVP</h2>
          <p style="color:#5C4D47;font-size:16px;line-height:1.6;margin-bottom:16px;">
            Hola ${coupleName},
          </p>
          <div style="background-color:#F5E6D3;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:600;color:${statusColor};">
              ${guestName} ${statusLabel}
            </p>
            <p style="margin:8px 0 0;color:#8B6A5A;font-size:14px;">
              Invitacion: ${invitationName}
            </p>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.APP_URL}/guests"
               style="display:inline-block;background-color:#D4714E;color:#FAF0E6;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
              Ver todos los invitados
            </a>
          </div>
        </td></tr>
        <tr><td style="background-color:#F5E6D3;padding:24px 48px;text-align:center;">
          <p style="margin:0;color:#8B6A5A;font-size:13px;">
            LOVEPOSTAL - <a href="https://lovepostal.studio" style="color:#D4714E;text-decoration:none;">lovepostal.studio</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
