// Email stub — Replit's Gmail connector is not available on Vercel.
// Configure SMTP_HOST env var to enable real email sending in a future update.

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderDetails: { orderId: string; items: string; total: string }
): Promise<void> {
  console.log(`[email] Order confirmation for ${name} <${to}> — order ${orderDetails.orderId}, total ${orderDetails.total}`);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string
): Promise<void> {
  console.log(`[email] Password reset for ${name} <${to}> — link: ${resetLink}`);
}
