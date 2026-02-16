const YOCO_API_URL = "https://payments.yoco.com/api/checkouts";

interface YocoCheckoutRequest {
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    displayName: string;
    quantity: number;
    pricingDetails: {
      price: number;
    };
  }>;
  totalTaxAmount?: number;
  subtotalAmount?: number;
}

interface YocoCheckoutResponse {
  id: string;
  redirectUrl: string;
  status: string;
  amount: number;
  currency: string;
}

export async function createYocoCheckout(params: {
  amountInCents: number;
  orderId: string;
  orderNumber: string;
  baseUrl: string;
  lineItems?: YocoCheckoutRequest["lineItems"];
  subtotalInCents?: number;
  taxInCents?: number;
}): Promise<YocoCheckoutResponse> {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("YOCO_SECRET_KEY is not configured");
  }

  if (params.amountInCents < 200) {
    throw new Error("Minimum payment amount is R2.00 (200 cents)");
  }

  const body: YocoCheckoutRequest = {
    amount: params.amountInCents,
    currency: "ZAR",
    successUrl: `${params.baseUrl}/payment/success?orderId=${params.orderId}`,
    cancelUrl: `${params.baseUrl}/payment/cancel?orderId=${params.orderId}`,
    failureUrl: `${params.baseUrl}/payment/failure?orderId=${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
    },
  };

  if (params.lineItems) {
    body.lineItems = params.lineItems;
  }
  if (params.subtotalInCents) {
    body.subtotalAmount = params.subtotalInCents;
  }
  if (params.taxInCents) {
    body.totalTaxAmount = params.taxInCents;
  }

  const response = await fetch(YOCO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Yoco checkout creation failed:", response.status, errorText);
    throw new Error(`Yoco checkout creation failed: ${response.status}`);
  }

  return response.json() as Promise<YocoCheckoutResponse>;
}

export async function getYocoCheckoutStatus(checkoutId: string): Promise<{ status: string; id: string; amount?: number; currency?: string }> {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("YOCO_SECRET_KEY is not configured");
  }

  const response = await fetch(`${YOCO_API_URL}/${checkoutId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Yoco checkout status check failed:", response.status, errorText);
    throw new Error(`Yoco checkout status check failed: ${response.status}`);
  }

  return response.json() as Promise<{ status: string; id: string }>;
}
