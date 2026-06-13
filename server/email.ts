import nodemailer from "nodemailer";

const SENDER_NAME = "Gaslite";
const SENDER_EMAIL = process.env.SMTP_FROM || "accounts@gaslite.co.za";

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderDetails: { orderId: string; items: string; total: string }
): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    console.log("[email] SMTP not configured — skipping order confirmation to", to);
    return;
  }
  await transport.sendMail({
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to,
    subject: `Order Confirmation #${orderDetails.orderId}`,
    html: `<p>Hi ${name},</p><p>Your order has been received.</p><p>${orderDetails.items}</p><p><strong>Total: ${orderDetails.total}</strong></p>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string
): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    console.log("[email] SMTP not configured — skipping password reset to", to, "link:", resetLink);
    return;
  }
  await transport.sendMail({
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to,
    subject: "Reset your Gaslite password",
    html: `<p>Hi ${name},</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this email.</p>`,
  });
}
