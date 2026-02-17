// src/lib/auth.ts
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

type JwtPayload = { role?: string; user_name?: string; sub?: string; exp?: number };

export function parseJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getRole(): "Admin" | "SuperAdmin" | "" {
  const t = getToken();
  if (!t) return "";
  const p = parseJwt(t);
  const role = (p?.role || "").trim();
  return role === "SuperAdmin" || role === "Admin" ? role : "";
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
