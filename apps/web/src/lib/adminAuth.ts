// src/lib/adminAuth.ts
import axios, { AxiosError } from "axios";

/** Base URL: Vite env overrides; default to 8080 per your setup */
const BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:8080";

/** Optional explicit admin login path(s) (comma-separated allowed) */
const ENV_PATHS: string[] = (() => {
  const v =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_ADMIN_LOGIN_PATH) ||
    "";
  return v
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
})();

/** Shared axios instance */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

/** Types */
export type AdminUser = {
  id?: string;
  _id?: string;
  email: string;
  role?: "admin" | string;
  name?: string;
};

export type LoginResponse = {
  token?: string;
  access_token?: string;
  session_token?: string;
  user?: AdminUser;
  // allow extra fields
  [k: string]: any;
};

/** Storage / header helpers */
const TOKEN_KEY = "admintoken";

function setAuthHeader(token?: string) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}
function getStoredToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) || undefined;
}
function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  setAuthHeader(token);
}

/** Normalize various token shapes into a single string */
function pickToken(data: LoginResponse | any): string | undefined {
  return data?.token || data?.access_token || data?.session_token || undefined;
}

/** Build candidate endpoints */
function getCandidatePaths(): string[] {
  if (ENV_PATHS.length) return ENV_PATHS;

  // Expand this list if needed; most common placements first
  return [
    "/api/v1/auth/admin/login",
    "/api/v1/admin/login",
    "/api/auth/admin/login",
    "/api/admin/login",
    "/admin/login",
    "/api/v1/auth/login",
    "/api/auth/login",
    "/auth/admin/login",
    "/auth/login",
    "/api/session/login",
    "/api/login",
    "/login",
    // token/oidc-ish
    "/api/auth/token",
    "/auth/token",
  ];
}

/** Build candidate request bodies (field name permutations) */
function getCandidateBodies(email: string, password: string) {
  return [
    { body: { email, password }, type: "json" as const },
    { body: { username: email, password }, type: "json" as const },
    { body: { identifier: email, password }, type: "json" as const },
    // role hint (some backends require it)
    { body: { email, password, role: "admin" }, type: "json" as const },
    {
      body: { username: email, password, role: "admin" },
      type: "json" as const,
    },

    // OAuth2 password grant–style (urlencoded)
    {
      body: new URLSearchParams({
        grant_type: "password",
        username: email,
        password,
      }),
      type: "urlencoded" as const,
    },
  ];
}

/** Low-level attempt with one path + one body variant */
async function tryOnce(
  path: string,
  variant: ReturnType<typeof getCandidateBodies>[number]
) {
  const isUrlEncoded = variant.type === "urlencoded";
  const headers = isUrlEncoded
    ? { "Content-Type": "application/x-www-form-urlencoded" }
    : { "Content-Type": "application/json" };

  const payload = isUrlEncoded ? variant.body : JSON.stringify(variant.body);

  const { data } = await api.post<LoginResponse>(path, payload, { headers });
  return data;
}

/** Try multiple endpoints/payloads until one succeeds (or throw) */
async function tryAdminLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  const endpoints = getCandidatePaths();
  const bodies = getCandidateBodies(email, password);

  const errors: { path: string; status?: number; msg?: string }[] = [];

  for (const path of endpoints) {
    for (const variant of bodies) {
      try {
        const data = await tryOnce(path, variant);
        const token = pickToken(data);
        if (token) saveToken(token);
        // expose which path worked (handy for debugging)
        (data as any).__login_path__ = path;
        return data;
      } catch (err) {
        const ax = err as AxiosError;
        const status = ax.response?.status;
        const msg =
          (ax.response?.data as any)?.error ??
          (ax.response?.data as any)?.message ??
          ax.message;
        errors.push({ path, status, msg });

        // Keep trying others; 404/405/501/400/401 are all acceptable to continue probing
        continue;
      }
    }
  }

  // Nothing worked
  const last = errors[errors.length - 1];
  const detail = last
    ? `(${last.status || "no-status"}) ${last.msg || "no message"}`
    : "";
  throw new Error(
    `Admin login failed: no known endpoint accepted credentials. ${detail}`
  );
}

export const AdminAuthService = {
  /** Primary login */
  async login(email: string, password: string): Promise<LoginResponse> {
    return tryAdminLogin(email, password);
  },

  /** Alias used by your context */
  async loginAdmin(email: string, password: string): Promise<LoginResponse> {
    return this.login(email, password);
  },

  /** Init auth header from localStorage (call once on app start) */
  bootstrap(): string | undefined {
    const t = getStoredToken();
    setAuthHeader(t);
    return t;
  },

  /** Set/clear token manually */
  setToken(token?: string) {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
      setAuthHeader(undefined);
    } else {
      saveToken(token);
    }
  },

  /** Read token */
  getToken(): string | undefined {
    return getStoredToken();
  },

  /** Logout */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    setAuthHeader(undefined);
  },

  /** expose axios instance */
  client: api,
};

/** Standalone helpers (in case other modules import these) */
export async function loginAdmin(email: string, password: string) {
  return AdminAuthService.login(email, password);
}
export function setAdminAuthHeader(token?: string) {
  AdminAuthService.setToken(token);
}

export default api;
