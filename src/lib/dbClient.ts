// src/lib/dbClient.ts
const DB_API_BASE_URL = import.meta.env.VITE_DB_API_BASE_URL as string;

export const TOKEN_KEY = "admin_token";

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function safeReadJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function dbFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${DB_API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
  });

  const json = await safeReadJson(res);

  if (!res.ok) {
    throw new Error(`DB HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`);
  }
  if (json && typeof json === "object" && (json as any).ok === false) {
    throw new Error((json as any).error || "ok:false");
  }

  return json as T;
}
