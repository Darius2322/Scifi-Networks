import { SignJWT, jwtVerify } from 'jose';

const TTL_SECONDS = 15 * 60; // 15 minutes to attach photos after submitting a report

export async function signAttachmentToken(ticketId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
  return new SignJWT({ scope: 'attachment_upload', ticket_id: ticketId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAttachmentToken(token: string, ticketId: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload.scope === 'attachment_upload' && payload.ticket_id === ticketId;
  } catch {
    return false;
  }
}
