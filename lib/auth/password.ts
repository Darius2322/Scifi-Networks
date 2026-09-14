import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Normalizes a Kenyan-style phone number into the default password format
 * used for initial agent credentials (per spec: password = phone number).
 * Stored immediately as a bcrypt hash — the raw value is never persisted.
 */
export function normalizePhoneForDefaultPassword(phone: string): string {
  return phone.replace(/\s+/g, '');
}
