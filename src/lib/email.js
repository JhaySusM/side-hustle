import nodemailer from "nodemailer";

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function otpEmailHtml(code) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:#f2f4f7; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f4f7; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(16,24,40,0.08);">
            <tr>
              <td style="padding:24px 32px; background-color:#0b1e39; text-align:center;">
                <span style="font-family:Arial, Helvetica, sans-serif; font-size:28px; font-weight:bold; letter-spacing:1px;">
                  <span style="color:#5ec6f2;">Tradi</span><span style="color:#f5c542;">Go</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <h1 style="margin:0; font-size:20px; color:#101828;">Verify your email</h1>
                <p style="margin:12px 0 0; font-size:14px; line-height:22px; color:#475467;">
                  Use the code below to finish signing in to your TradiGo account. This code expires in 10 minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;">
                <div style="background-color:#f2f4f7; border-radius:8px; padding:18px; text-align:center;">
                  <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#101828;">${code}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0; font-size:13px; line-height:20px; color:#667085;">
                  Didn't request this code? You can safely ignore this email — your account is still secure.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px; border-top:1px solid #eaecf0;">
                <p style="margin:0 0 8px; font-size:13px; font-weight:bold; color:#101828;">TradiGo — Your Digital Marketplace</p>
                <p style="margin:0; font-size:12px; line-height:18px; color:#98a2b3;">
                  Buy and sell across Cars, Property, Mobile Phones, Jobs, Fashion, and more — secure payments and verified sellers on every listing.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px; background-color:#fafafa;">
                <p style="margin:0; font-size:11px; color:#98a2b3; text-align:center;">© 2026 TradiGo.com — All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(to, code) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("GMAIL_USER/GMAIL_APP_PASSWORD is not configured");
    }
    // Local dev convenience: no Gmail credentials configured yet, so just
    // log the code instead of failing registration outright.
    console.warn(`[dev] Gmail SMTP not configured — verification code for ${to}: ${code}`);
    return;
  }

  await getTransporter().sendMail({
    from: `"TradiGO" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your TradiGO verification code",
    html: otpEmailHtml(code),
  });
}
