import crypto from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "carecircle-catalyst-secret-key-2026-hackathon";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: "PRIMARY_CAREGIVER" | "FAMILY_MEMBER" | "ELDERLY_USER";
  circleId?: string;
}

export interface ElderSession {
  circleId: string;
  elderName: string;
  isElder: true;
}

// Salted Hash for Passwords
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// Salted Hash for Senior 4-6 digit PIN
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(8).toString("hex");
  const hash = crypto.createHmac("sha256", salt).update(pin.trim()).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, storedPinHash: string): boolean {
  try {
    const [salt, key] = storedPinHash.split(":");
    if (!salt || !key) return false;
    const hash = crypto.createHmac("sha256", salt).update(pin.trim()).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// Lightweight, secure HMAC token signing for App Router
export function createSessionToken(payload: SessionUser | ElderSession): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days expiration
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifySessionToken<T = SessionUser | ElderSession>(token: string): T | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (parsed.exp && Date.now() > parsed.exp) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}
