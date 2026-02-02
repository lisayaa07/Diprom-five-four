import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return res.status(500).json({ error: "API_BASE_URL not configured" });
  }

  // Build path from catch-all segments
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : path || "";

  // Build full URL with query params
  const url = new URL(`${baseUrl}/${apiPath}`);
  const queryString = req.url?.split("?")[1];
  if (queryString) {
    new URLSearchParams(queryString).forEach((value, key) => {
      if (key !== "path") url.searchParams.append(key, value);
    });
  }

  // Forward headers (except host)
  const headers: HeadersInit = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== "host" && value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: req.method || "GET",
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Disable caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const data = await response.text();
    res.status(response.status);

    try {
      return res.json(JSON.parse(data));
    } catch {
      return res.send(data);
    }
  } catch (error) {
    return res.status(500).json({
      error: "Proxy failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
