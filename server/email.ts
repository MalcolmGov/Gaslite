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

function getAppBaseUrl(): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  if (process.env.REPLIT_DEPLOYMENT_URL) {
    return process.env.REPLIT_DEPLOYMENT_URL;
  }
  return 'https://gaslite.replit.app';
}

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const logoUrl = `${getAppBaseUrl()}/gaslite-logo.png`;
  const itemsRows = data.items.map(item => `
    <tr>
      <td style="padding: 14px 20px; border-bottom: 1px solid #E8EDF2; font-size: 14px; color: #1E293B; font-weight: 500;">
        ${escapeHtml(item.productName)}<br/>
        <span style="font-size: 12px; color: #64748B; font-weight: 400;">${escapeHtml(item.productSize)} cylinder</span>
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #E8EDF2; font-size: 14px; color: #475569; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #E8EDF2; font-size: 14px; color: #475569; text-align: right;">
        R${Number(item.unitPrice).toFixed(2)}
      </td>
      <td style="padding: 14px 20px; border-bottom: 1px solid #E8EDF2; font-size: 14px; color: #0F172A; text-align: right; font-weight: 700;">
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
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F172A;">
    <tr>
      <td style="padding: 32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto;">

          <!-- Top Brand Bar with Logo -->
          <tr>
            <td style="padding: 0 0 24px; text-align: center;">
              <img src="${logoUrl}" alt="Gaslite" width="180" style="display: inline-block; height: auto; max-width: 180px;" />
            </td>
          </tr>

          <!-- Hero Header -->
          <tr>
            <td style="background-color: #1E3A5F; border-radius: 16px 16px 0 0; padding: 48px 40px 40px; text-align: center;">
              <!-- Checkmark Circle -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="background-color: #10B981; width: 64px; height: 64px; text-align: center; vertical-align: middle; border-radius: 32px;">
                    <span style="color: #FFFFFF; font-size: 32px; line-height: 64px;">&#10003;</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: -0.3px;">Order Confirmed</h1>
              <p style="margin: 8px 0 0; color: #94A3B8; font-size: 15px; font-weight: 400;">Payment successfully processed</p>
              <!-- Order Number Pill -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px auto 0;">
                <tr>
                  <td style="background-color: #2563EB; border-radius: 20px; padding: 8px 24px;">
                    <span style="color: #FFFFFF; font-size: 13px; font-weight: 600; letter-spacing: 1px;">ORDER #${data.orderId.slice(0, 8).toUpperCase()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 0; border-radius: 0 0 16px 16px;">

              <!-- Greeting -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 36px 40px 20px;">
                    <p style="margin: 0; color: #0F172A; font-size: 18px; font-weight: 600;">Hi ${escapeHtml(data.customerName)},</p>
                    <p style="margin: 10px 0 0; color: #64748B; font-size: 14px; line-height: 1.7;">
                      Thank you for choosing Gaslite! Your order has been placed and payment received. A driver near you will be assigned shortly.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Delivery Info Cards -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 40px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Date Card -->
                        <td width="48%" style="background-color: #F1F5F9; border-radius: 12px; padding: 18px 20px; vertical-align: top;">
                          <p style="margin: 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Order Date</p>
                          <p style="margin: 6px 0 0; color: #0F172A; font-size: 14px; font-weight: 600;">${data.orderDate}</p>
                        </td>
                        <td width="4%"></td>
                        <!-- Payment Card -->
                        <td width="48%" style="background-color: #F1F5F9; border-radius: 12px; padding: 18px 20px; vertical-align: top;">
                          <p style="margin: 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Payment</p>
                          <p style="margin: 6px 0 0; color: #0F172A; font-size: 14px; font-weight: 600;">Card &#8226; Paid</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 40px 0;">
                    <!-- Address Card -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: #F1F5F9; border-radius: 12px; padding: 18px 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="36" style="vertical-align: top;">
                                <table role="presentation" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="background-color: #3B82F6; width: 32px; height: 32px; text-align: center; vertical-align: middle; border-radius: 8px;">
                                      <span style="color: #FFFFFF; font-size: 16px; line-height: 32px;">&#9906;</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 12px; vertical-align: top;">
                                <p style="margin: 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Delivery Address</p>
                                <p style="margin: 4px 0 0; color: #0F172A; font-size: 14px; font-weight: 600; line-height: 1.4;">${escapeHtml(data.deliveryAddress)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 28px 40px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="border-bottom: 2px solid #E2E8F0;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 40px 4px;">
                    <p style="margin: 0; color: #0F172A; font-size: 16px; font-weight: 700;">Order Summary</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr style="background-color: #F8FAFC;">
                        <th style="padding: 10px 20px; text-align: left; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; border-bottom: 2px solid #E2E8F0;">Item</th>
                        <th style="padding: 10px 16px; text-align: center; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; border-bottom: 2px solid #E2E8F0;">Qty</th>
                        <th style="padding: 10px 16px; text-align: right; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; border-bottom: 2px solid #E2E8F0;">Price</th>
                        <th style="padding: 10px 20px; text-align: right; font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; border-bottom: 2px solid #E2E8F0;">Total</th>
                      </tr>
                      ${itemsRows}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment Breakdown -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 40px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 16px; color: #0F172A; font-size: 16px; font-weight: 700;">Payment Receipt</p>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding: 5px 0; color: #64748B; font-size: 14px;">Subtotal</td>
                              <td style="padding: 5px 0; color: #334155; font-size: 14px; text-align: right; font-weight: 500;">R${Number(data.subtotal).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0; color: #64748B; font-size: 14px;">Delivery Fee</td>
                              <td style="padding: 5px 0; color: #334155; font-size: 14px; text-align: right; font-weight: 500;">R${Number(data.serviceFee).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding: 5px 0; color: #64748B; font-size: 14px;">Card Processing Fee <span style="font-size: 11px; color: #94A3B8;">(2.6% + 15% VAT)</span></td>
                              <td style="padding: 5px 0; color: #334155; font-size: 14px; text-align: right; font-weight: 500;">R${Number(data.cardProcessingFee).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 10px 0 8px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="border-bottom: 2px dashed #CBD5E1;"></td></tr></table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #0F172A; font-size: 18px; font-weight: 800;">Total Paid</td>
                              <td style="padding: 4px 0; font-size: 18px; font-weight: 800; text-align: right;">
                                <span style="color: #10B981;">R${Number(data.total).toFixed(2)}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What's Next Steps -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 28px 40px 0;">
                    <p style="margin: 0 0 16px; color: #0F172A; font-size: 16px; font-weight: 700;">What happens next?</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 0 0 14px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                                  <td style="background-color: #DBEAFE; width: 32px; height: 32px; text-align: center; vertical-align: middle; border-radius: 16px;">
                                    <span style="color: #2563EB; font-size: 14px; font-weight: 800; line-height: 32px;">1</span>
                                  </td>
                                </tr></table>
                              </td>
                              <td style="vertical-align: middle; padding-left: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 14px; font-weight: 500;">A driver near you will be assigned to your order</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 14px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                                  <td style="background-color: #DBEAFE; width: 32px; height: 32px; text-align: center; vertical-align: middle; border-radius: 16px;">
                                    <span style="color: #2563EB; font-size: 14px; font-weight: 800; line-height: 32px;">2</span>
                                  </td>
                                </tr></table>
                              </td>
                              <td style="vertical-align: middle; padding-left: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 14px; font-weight: 500;">Track your driver live on the map in real time</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="40" style="vertical-align: top;">
                                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                                  <td style="background-color: #D1FAE5; width: 32px; height: 32px; text-align: center; vertical-align: middle; border-radius: 16px;">
                                    <span style="color: #059669; font-size: 14px; font-weight: 800; line-height: 32px;">3</span>
                                  </td>
                                </tr></table>
                              </td>
                              <td style="vertical-align: middle; padding-left: 8px;">
                                <p style="margin: 0; color: #334155; font-size: 14px; font-weight: 500;">Your gas arrives within 30-60 minutes</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Estimated Delivery Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 28px 40px 36px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: #0F172A; border-radius: 12px; padding: 20px 24px; text-align: center;">
                          <p style="margin: 0; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Estimated Delivery</p>
                          <p style="margin: 6px 0 0; color: #FFFFFF; font-size: 22px; font-weight: 800;">30 - 60 minutes</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0; color: #64748B; font-size: 13px; font-weight: 500;">Gaslite</p>
              <p style="margin: 4px 0 0; color: #475569; font-size: 12px;">On-Demand LPG Gas Delivery &bull; South Africa</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 16px auto 0;">
                <tr>
                  <td style="border-top: 1px solid #334155; padding-top: 16px;">
                    <p style="margin: 0; color: #475569; font-size: 11px;">This is an automated receipt. Please do not reply to this email.</p>
                    <p style="margin: 4px 0 0; color: #475569; font-size: 11px;">Need help? Contact us at support@gaslite.co.za</p>
                  </td>
                </tr>
              </table>
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
