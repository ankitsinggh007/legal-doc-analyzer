export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let data = "";
  for await (const chunk of req) data += chunk;
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
