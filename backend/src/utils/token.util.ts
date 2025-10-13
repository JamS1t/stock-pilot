import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const ACCESS_MINUTES = Number(process.env.ACCESS_EXP_MINUTES || 15);
const REFRESH_KEY = process.env.REFRESH_HMAC_KEY!;
const REFRESH_DAYS = Number(process.env.REFRESH_EXP_DAYS || 30);

export function signAccessToken(payload: object): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: `${ACCESS_MINUTES}m` });
}
export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}
export function genRefreshRaw(): { raw: string; hash: string; expiresAt: Date } {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHmac('sha256', REFRESH_KEY).update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  return { raw, hash, expiresAt };
}
export function hashRefresh(raw: string) {
  return crypto.createHmac('sha256', REFRESH_KEY).update(raw).digest('hex');
}
export async function verifyGoogleToken(idToken: string): Promise<TokenPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('INVALID_GOOGLE_TOKEN');
  return payload;
}
