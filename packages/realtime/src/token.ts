import { createHmac, timingSafeEqual } from "crypto";

export interface RealtimeTokenPayload {
  type: "agent" | "visitor";
  organizationId: string;
  userId?: string;
  userName?: string | null;
  conversationId?: string;
  visitorId?: string;
  exp: number;
}

export function createRealtimeToken(
  payload: Omit<RealtimeTokenPayload, "exp">,
  secret: string,
  ttlMs = 60 * 60 * 1000,
): string {
  const data: RealtimeTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyRealtimeToken(
  token: string,
  secret: string,
): RealtimeTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");

  try {
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as RealtimeTokenPayload;

    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.organizationId || !payload.type) return null;

    return payload;
  } catch {
    return null;
  }
}
