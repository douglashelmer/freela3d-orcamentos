import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOtpEmail(to: string, code: string) {
  await resend.emails.send({
    from: 'Freela3D <noreply@freela3d.pro>',
    to,
    subject: `${code} — Código de acesso Freela3D`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#111;margin-bottom:8px">Código de verificação</h2>
        <p style="color:#555;margin-bottom:24px">Use o código abaixo para acessar o assistente Freela3D via WhatsApp:</p>
        <div style="background:#f4f4f5;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#111">${code}</div>
        <p style="color:#888;font-size:13px;margin-top:24px">Válido por 10 minutos. Não compartilhe este código.</p>
      </div>
    `,
  })
}
