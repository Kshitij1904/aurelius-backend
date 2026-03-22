const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // auto secure
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error("❌ SMTP VERIFY ERROR:", error);
    } else {
      console.log("✅ SMTP READY");
    }
  });

  return transporter;
};

exports.sendOTPEmail = async (to, name, otp) => {
  const transporter = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c14;padding:40px 20px">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#0f1520;border-radius:24px;border:1px solid rgba(255,255,255,0.1);overflow:hidden">
            <tr>
              <td style="background:linear-gradient(135deg,#7c3aed,#34d399);padding:28px;text-align:center">
                <h1 style="color:white;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px">₹ Aurelius</h1>
                <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">Personal Finance Tracker</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px">
                <h2 style="color:white;font-size:20px;font-weight:600;margin:0 0 10px">Hi ${name} 👋</h2>
                <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.6;margin:0 0 28px">
                  Use the code below to verify your email address. This code expires in <strong style="color:white">10 minutes</strong>.
                </p>
                <div style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:16px;padding:24px;text-align:center;margin-bottom:28px">
                  <p style="color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px">Your OTP Code</p>
                  <h1 style="color:white;font-size:42px;font-weight:700;letter-spacing:12px;margin:0;font-family:monospace">${otp}</h1>
                </div>
                <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0">
                  If you didn't request this, please ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;text-align:center">
                <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0">© ${new Date().getFullYear()} Aurelius. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  if (process.env.NODE_ENV !== "production") {
    console.log("📧 Sending OTP:", otp, "to:", to);
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email service not configured properly");
  }

  try {
    const info = await transporter.sendMail({
      from: `"Aurelius Finance" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${otp} is your Aurelius verification code`,
      html,
    });
    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ EMAIL SEND ERROR:", err);
    throw err;
  }
};
