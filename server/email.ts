// Email service using Replit's Google Mail connector (connection:conn_google-mail_01KFDNHY651YCWX69RPRFJVCDG)
import { google } from 'googleapis';

let connectionSettings: any;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not set');
  }

  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

const SENDER_NAME = "Gaslite";
const SENDER_EMAIL = "malcolmgov24@gmail.com";

function createMimeMessage(to: string, subject: string, htmlBody: string): string {
  const boundary = "boundary_" + Date.now();
  const mimeMessage = [
    `From: ${SENDER_NAME} <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(mimeMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderDate: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    productSize: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  subtotal: string;
  serviceFee: string;
  cardProcessingFee: string;
  total: string;
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemsRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151;">
        ${escapeHtml(item.productName)} (${escapeHtml(item.productSize)})
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151; text-align: right;">
        R${Number(item.unitPrice).toFixed(2)}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">
        R${Number(item.totalPrice).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Gaslite</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">On-Demand LPG Gas Delivery</p>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #ECFDF5; border-radius: 8px; padding: 20px 24px; text-align: center;">
                    <p style="margin: 0; color: #059669; font-size: 16px; font-weight: 600;">Order Confirmed & Payment Received</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 16px 40px 8px;">
              <p style="margin: 0; color: #111827; font-size: 16px;">Hi ${escapeHtml(data.customerName)},</p>
              <p style="margin: 12px 0 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
                Thank you for your order! Your payment has been processed successfully. A driver will be assigned shortly and your gas will be delivered within 30-60 minutes.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 24px 40px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #E5E7EB;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600;">#${data.orderId.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #E5E7EB;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600;">${data.orderDate}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 16px 20px;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600;">${escapeHtml(data.deliveryAddress)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 24px 40px 8px;">
              <p style="margin: 0 0 12px; color: #111827; font-size: 15px; font-weight: 600;">Order Items</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Item</th>
                  <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Qty</th>
                  <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Price</th>
                  <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Total</th>
                </tr>
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Payment Summary -->
          <tr>
            <td style="padding: 24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 16px 20px 8px;">
                    <p style="margin: 0; color: #111827; font-size: 15px; font-weight: 600;">Payment Receipt</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 14px;">Subtotal</td>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 14px; text-align: right;">R${Number(data.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 14px;">Delivery Fee</td>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 14px; text-align: right;">R${Number(data.serviceFee).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 14px;">Card Processing Fee</td>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 14px; text-align: right;">R${Number(data.cardProcessingFee).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 20px; color: #4B5563; font-size: 12px; font-style: italic;">(2.6% + 15% VAT)</td>
                  <td style="padding: 6px 20px;"></td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 4px 20px;"><hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;" /></td>
                </tr>
                <tr>
                  <td style="padding: 10px 20px 16px; color: #111827; font-size: 16px; font-weight: 700;">Total Paid</td>
                  <td style="padding: 10px 20px 16px; color: #059669; font-size: 16px; font-weight: 700; text-align: right;">R${Number(data.total).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 0 20px 16px;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px;">Payment Method: Card</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #EFF6FF; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 8px; color: #1D4ED8; font-size: 14px; font-weight: 600;">What happens next?</p>
                    <ol style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 1.8;">
                      <li>A driver near you will be assigned to your order</li>
                      <li>You'll be able to track the driver live on the map</li>
                      <li>Your gas will arrive within 30-60 minutes</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">Gaslite - On-Demand LPG Gas Delivery</p>
              <p style="margin: 6px 0 0; color: #9CA3AF; font-size: 11px;">South Africa</p>
              <p style="margin: 10px 0 0; color: #D1D5DB; font-size: 11px;">This is an automated email. Please do not reply directly.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const gmail = await getGmailClient();
    const subject = `Order Confirmed - #${data.orderId.slice(0, 8).toUpperCase()} | Gaslite`;
    const html = buildOrderConfirmationHtml(data);
    const raw = createMimeMessage(data.customerEmail, subject, html);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    console.log(`Order confirmation email sent to ${data.customerEmail} for order ${data.orderId}`);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}
