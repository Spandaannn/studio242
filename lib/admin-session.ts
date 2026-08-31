// FLM-13 — admin auth primitives. Pure Web Crypto (crypto.subtle), zero
// Next.js imports and zero npm dependencies. That's deliberate: this module
// is imported by BOTH proxy.ts (Next 16 renamed "middleware" to "proxy"; it
// now defaults to the Node runtime, but historically ran on Edge, where
// Node's `crypto` module isn't available) and Server Actions (Node runtime).
// Web Crypto is a standard global either way, so one implementation works
// unmodified in both places, instead of juggling two crypto APIs.

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function base64url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  // `new Uint8Array(length)` always allocates a real ArrayBuffer — unlike
  // `Uint8Array.from(iterable, mapfn)`, which TS types as the looser
  // `Uint8Array<ArrayBufferLike>` and crypto.subtle's BufferSource rejects.
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(digest);
}

// XOR-accumulate every byte rather than short-circuiting on the first
// mismatch — a naive `for` loop with an early `return false` leaks timing
// information an attacker could use to guess the password byte-by-byte.
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(submitted: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("ADMIN_PASSWORD is not set — refusing all logins.");
    return false;
  }
  const [a, b] = await Promise.all([sha256(submitted), sha256(expected)]);
  return constantTimeEqual(a, b);
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Not a JWT — no header, no algorithm negotiation, just a signed {exp}
// payload. There's exactly one claim and one consumer, so standardizing it
// would add complexity without buying anything.
export async function createSessionCookie(): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS });
  const payloadB64 = base64url(new TextEncoder().encode(payload));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64url(new Uint8Array(signature))}`;
}

export async function verifySessionCookie(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    // Malformed base64, malformed JSON, missing SESSION_SECRET — all the
    // same outcome: not authenticated.
    return false;
  }
}
