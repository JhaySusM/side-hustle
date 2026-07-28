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
    html: `<p>Your TradiGO verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
  });
}
