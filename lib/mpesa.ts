/**
 * M-Pesa Daraja (Lipa Na M-Pesa Online / STK Push) integration.
 *
 * Required env vars — see .env.example:
 *   MPESA_ENV                 'sandbox' | 'production'
 *   MPESA_CONSUMER_KEY
 *   MPESA_CONSUMER_SECRET
 *   MPESA_SHORTCODE           Till or Paybill number
 *   MPESA_PASSKEY              from the Daraja app (Lipa Na M-Pesa Online passkey)
 *   MPESA_CALLBACK_URL         full public HTTPS URL to /api/mpesa/callback
 *
 * Safaricom's sandbox generally REQUIRES the callback URL to be publicly
 * reachable over HTTPS — Vercel's deployment URL works, localhost does not.
 */

function baseUrl() {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

/** Accepts 07xxxxxxxx, +254xxxxxxxxx, or 254xxxxxxxxx — returns 254xxxxxxxxx. */
export function formatMpesaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (/^254\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^\d{9}$/.test(digits)) return `254${digits}`;
  return null;
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`M-Pesa auth failed (${res.status})`);
  }
  const json = await res.json();
  return json.access_token as string;
}

function timestampNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

export type StkPushResult = {
  merchantRequestId: string;
  checkoutRequestId: string;
};

/**
 * Triggers the STK push prompt on the customer's phone. Amount must be a
 * whole number of KES (M-Pesa does not accept decimals).
 */
export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountReference: string; // shows on the customer's phone — use the order number
  transactionDesc: string;
}): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const timestamp = timestampNow();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const token = await getAccessToken();

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amount),
      PartyA: params.phone,
      PartyB: shortcode,
      PhoneNumber: params.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.transactionDesc.slice(0, 13),
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json || json.ResponseCode !== '0') {
    throw new Error(json?.errorMessage || json?.ResponseDescription || 'STK push failed to initiate.');
  }

  return {
    merchantRequestId: json.MerchantRequestID,
    checkoutRequestId: json.CheckoutRequestID,
  };
}
