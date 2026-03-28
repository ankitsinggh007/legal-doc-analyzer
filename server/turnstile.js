/* global process, URLSearchParams */

export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("Server misconfigured: TURNSTILE_SECRET_KEY is missing.");
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip) body.append("remoteip", ip);

  const resp = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body }
  );
  const data = await resp.json().catch(() => ({}));
  return Boolean(data?.success);
}
