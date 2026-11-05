import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'seo_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token) {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}
