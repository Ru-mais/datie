import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_KEY || "datie-default-jwt-secret-key-change-in-prod";

export function signJWT(payload: Record<string, unknown>, expiresInSeconds: number = 3600): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encode = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");

  const headerEncoded = encode(header);
  const payloadEncoded = encode(fullPayload);

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest("base64url");

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export function verifyJWT<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerEncoded}.${payloadEncoded}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && (payload.exp as number) < now) {
      return null;
    }

    return payload as T;
  } catch {
    return null;
  }
}
