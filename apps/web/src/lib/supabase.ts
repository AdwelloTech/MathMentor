// axios-powered Supabase-like client for the Mongo adaptor
import axios, { AxiosInstance, AxiosError } from "axios";

export type Query = Record<string, any>;
export type Sort = Record<string, 1 | -1>;

export interface SelectOptions {
  q?: Query | null;
  limit?: number;
  skip?: number;
  sort?: Sort | null;
}

export type Result<Data> =
  | { data: Data; error: null }
  | { data: null; error: any };

// ✅ Export this so other libs (subjects, notes, etc.) can import it
export function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL || (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    // ✅ Default to 8080 (your API runs here)
    "http://localhost:8080";
  return (url || "http://localhost:8080").replace(/\/$/, "");
}

// ------------------------------ Axios client -------------------------------
function makeAxios(baseURL: string): AxiosInstance {
  const sendCreds =
    typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_SEND_CREDENTIALS === "true";

  const instance = axios.create({
    baseURL,
    // NOTE: baseURL auto-failover: if :8080 fails, try :8080 (and vice versa)

    withCredentials: !!sendCreds,
    headers: { "Content-Type": "application/json" },
  });

  // ✅ Prevent 304-no-body issues by forcing revalidation and a unique URL for GETs
  instance.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();
    if (method === "get") {
      config.params = { ...(config.params || {}), _ts: Date.now() };
      config.headers = { ...(config.headers || {}), "Cache-Control": "no-cache" };
    }
    return config;
  });

  
  // --- Auto-failover on network error (connection refused / CORS preflight fail) ---
  instance.interceptors.response.use(
    (res) => res,
    async (err: any) => {
      const isNetwork = !err.response && !!err.message;
      const cfg = err.config || {};
      if (isNetwork && !cfg.__failoverTried) {
        const current = (instance.defaults.baseURL || "") as string;
        const next =
          current.includes(":8080") ? current.replace(":8080", ":8080")
          : current.includes(":8080") ? current.replace(":8080", ":8080")
          : "";
        if (next) {
          try {
            // Switch base and retry once
            instance.defaults.baseURL = next;
            cfg.baseURL = next;
            cfg.__failoverTried = true;
            return await instance.request(cfg);
          } catch (e) {
            // fall through to original error
          }
        }
      }
      // normalize existing error (keep your previous normalization if any)
      return Promise.reject(err);
    }
  );

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError<any>) => {
      // Normalize and include method/url for better logging
      const norm = {
        status: err.response?.status ?? 0,
        data: err.response?.data ?? null,
        message: err.message,
        method: (err.config?.method || "").toUpperCase(),
        url: err.config?.url || "",
      };
      return Promise.reject(norm);
    }
  );
  return instance;
}

// ------------------------------ Custom RPC routing -------------------------
// Map each "RPC" name to your REST endpoint.
// Tweak these to match your backend routes.
type RpcRoute = {
  method: "get" | "post" | "patch" | "put" | "delete";
  url: string | ((args: any) => string);
  // Build axios request init (params/data) from args
  build?: (args: any) => { params?: any; data?: any };
};

const RPC_ROUTE_MAP: Record<string, RpcRoute> = {
  // NOTES
  search_study_notes: {
    method: "get",
    url: "/api/study-notes/search",
    build: (a) => ({
      params: {
        q: a?.search_term ?? "",
        subject: a?.subject_filter ?? undefined,
        grade: a?.grade_filter ?? undefined,
      },
    }),
  },
  increment_note_view_count: {
    method: "post",
    url: (a) => `/api/study-notes/${encodeURIComponent(a?.note_id)}/views`,
  },

  // AVAILABILITY
  check_tutor_availability: {
    method: "get",
    url: "/api/tutors/availability/check",
    build: (a) => ({
      params: {
        tutor_id: a?.p_tutor_id,
        date: a?.p_date,
        start_time: a?.p_start_time,
        end_time: a?.p_end_time,
      },
    }),
  },

  // BOOKINGS
  cancel_booking_atomic: {
    method: "post",
    url: "/api/bookings/cancel",
    build: (a) => ({
      data: {
        booking_id: a?.p_booking_id,
        class_id: a?.p_class_id,
      },
    }),
  },

  // JITSI
  generate_jitsi_meeting: {
    method: "post",
    url: "/api/jitsi/meetings",
    build: (a) => ({
      data: {
        tutor_id: a?.p_tutor_id,
        class_id: a?.p_class_id,
        topic: a?.p_topic,
        duration_minutes: a?.p_duration_minutes ?? 60,
      },
    }),
  },
  manual_generate_jitsi_for_class: {
    method: "post",
    url: (a) => `/api/jitsi/classes/${encodeURIComponent(a?.class_uuid)}/manual`,
  },
};

// Executes a mapped "RPC" as a REST call
async function callCustomRpc<T = any>(
  api: AxiosInstance,
  fnName: string,
  args?: any
): Promise<Result<T>> {
  const route = RPC_ROUTE_MAP[fnName];
  if (!route) {
    return {
      data: null,
      error: {
        status: 501,
        message: `RPC '${fnName}' not implemented in custom mode`,
      },
    };
  }
  const url = typeof route.url === "function" ? route.url(args ?? {}) : route.url;
  const payload = route.build ? route.build(args ?? {}) : {};
  try {
    const res =
      route.method === "get"
        ? await api.get(url, { params: payload?.params })
        : await api.request({
            method: route.method,
            url,
            params: payload?.params,
            data: payload?.data,
          });
    return { data: (res as any)?.data ?? null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ------------------------------ RPC wrapper --------------------------------
// IMPORTANT: We DO NOT use /api/rpc/* anymore.
// Everything goes through the custom route map above.
async function callRpc<T = any>(
  api: AxiosInstance,
  fnName: string,
  args?: any
): Promise<Result<T>> {
  return callCustomRpc<T>(api, fnName, args);
}

// --------------------------- QueryBuilder (from) ---------------------------
class QueryBuilder<T = any> {
  private api: AxiosInstance;
  private table: string;
  private _q: Query = {} as Query;
  private _limit: number | undefined;
  private _skip: number | undefined;
  private _sort: Sort | undefined;
  private _selectStar = true;

  constructor(api: AxiosInstance, table: string) {
    this.api = api;
    this.table = table;
  }

  private _mergeCond(field: string, op: string, value: any) {
    const existing = this._q[field];
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      (existing as any)[op] = value;
      this._q[field] = existing;
    } else if (existing !== undefined && op === "$eq") {
      this._q[field] = value;
    } else if (existing !== undefined && op !== "$eq") {
      this._q[field] = { $eq: existing, [op]: value } as any;
    } else {
      this._q[field] = op === "$eq" ? value : ({ [op]: value } as any);
    }
  }

  select(_cols: string = "*") { this._selectStar = true; return this; }

  eq(field: string, value: any) { this._mergeCond(field, "$eq", value); return this; }
  neq(field: string, value: any) { this._mergeCond(field, "$ne", value); return this; }
  in(field: string, values: any[]) { this._mergeCond(field, "$in", values); return this; }
  contains(field: string, value: any) { this._mergeCond(field, "$contains", value); return this; }
  ilike(field: string, pattern: string) {
    const regex = pattern.replace(/%/g, ".*");
    this._mergeCond(field, "$regex", new RegExp(regex, "i"));
    return this;
  }

  // comparison operators (support .gte() etc.)
  lt(field: string, value: any)  { this._mergeCond(field, "$lt",  value); return this; }
  lte(field: string, value: any) { this._mergeCond(field, "$lte", value); return this; }
  gt(field: string, value: any)  { this._mergeCond(field, "$gt",  value); return this; }
  gte(field: string, value: any) { this._mergeCond(field, "$gte", value); return this; }

  is(field: string, value: any) {
    if (value === null) this._mergeCond(field, "$eq", null);
    else this._mergeCond(field, "$eq", value);
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this._sort = { [field]: (opts?.ascending === false ? -1 : 1) as 1 | -1 };
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  range(from: number, to: number) { this._skip = from; this._limit = Math.max(0, to - from + 1); return this; }

  async single(): Promise<Result<T>> {
    const r = await this._exec<T[]>();
    if ((r as any).error) return { data: null, error: (r as any).error };
    return { data: (((r as any).data || [])[0] ?? null) as any, error: null };
  }

  async maybeSingle(): Promise<Result<T | null>> { return this.single(); }

  async _exec<R = any[]>(): Promise<Result<R>> {
    try {
      const q = JSON.parse(JSON.stringify(this._q, (_k, v) => {
        if (v instanceof RegExp) return { $regex: v.source, $options: v.flags || undefined };
        return v;
      }));

      const res = await this.api.get(`/api/${this.table}`, {
        params: {
          q: Object.keys(q).length ? JSON.stringify(q) : undefined,
          limit: this._limit,
          skip: this._skip,
          sort: this._sort ? JSON.stringify(this._sort) : undefined,
        },
      });

      // Normalize like Supabase: always return an array for list selects
      let raw: any = (res as any)?.data?.data ?? (res as any)?.data ?? null;
      if (raw == null) raw = [];
      if (!Array.isArray(raw)) raw = [raw];

      return { data: raw as R, error: null };
    } catch (err: any) {
      return { data: null as any, error: err };
    }
  }

  async insert(values: Partial<T> | Partial<T>[]): Promise<Result<T[]>> {
    try {
      const res = await this.api.post(`/api/${this.table}`, values);
      return { data: Array.isArray(res.data) ? res.data : [res.data], error: null };
    } catch (err: any) {
      return { data: null as any, error: err };
    }
  }

  async update(patch: Partial<T>): Promise<Result<T[]>> {
    try {
      const res = await this.api.patch(`/api/${this.table}`, { q: this._q, patch });
      return { data: res.data as T[], error: null };
    } catch (err: any) {
      return { data: null as any, error: err };
    }
  }

  async delete(): Promise<Result<number>> {
    try {
      const res = await this.api.request({
        method: "DELETE",
        url: `/api/${this.table}`,
        data: { q: this._q },
      });
      return { data: (res.data?.deleted ?? res.data ?? 0) as number, error: null };
    } catch (err: any) {
      return { data: null as any, error: err };
    }
  }
}

// ------------------------------- Helpers -----------------------------------
const hasStorage = typeof window !== "undefined" && !!window.localStorage;
function load<T>(key: string): T | null {
  if (!hasStorage) return null;
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function save(key: string, v: unknown) { if (hasStorage) localStorage.setItem(key, JSON.stringify(v)); }
function clearKey(key: string) { if (hasStorage) localStorage.removeItem(key); }
const nowISO = () => new Date().toISOString();

type AnyObj = Record<string, any>;

const deriveIdFromEmail = (email: string) =>
  (email || "").toLowerCase().replace(/[^a-z0-9]/gi, "") + "-id";

function normalizeId(p: AnyObj): string {
  return (p?.user_id ?? p?._id ?? p?.id ?? "").toString();
}

function unwrap(res: any) {
  const data = res?.data?.data ?? res?.data ?? res;
  return data;
}

async function getOne(api: AxiosInstance, filter: AnyObj): Promise<any | null> {
  const r = await api.get(`/api/profiles`, {
    params: {
      q: JSON.stringify(filter),
      limit: 1,
    },
  });
  const data = unwrap(r);
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

// --------------------------- Mongo "db" facade ------------------------------
function dbFacade(api: AxiosInstance) {
  const profiles = {
    async getById<T = AnyObj>(id: string): Promise<T | null> {
      try {
        const r = await api.get(`/api/profiles/${encodeURIComponent(id)}`);
        return unwrap(r) as T;
      } catch (e: any) {
        if (e?.status !== 404) throw e;
      }
      try {
        const doc = await getOne(api, { user_id: id });
        if (doc) return doc as T;
      } catch (e: any) {
        if (e?.status !== 404) throw e;
      }
      try {
        const doc = await getOne(api, { _id: id });
        if (doc) return doc as T;
      } catch (e: any) {
        if (e?.status !== 404) throw e;
      }
      return null;
    },

    async getByEmail<T = AnyObj>(email: string): Promise<T | null> {
      const em = (email || "").toLowerCase().trim();
      try {
        const doc = await getOne(api, { email: em });
        return (doc ?? null) as T | null;
      } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
      }
    },

    async create<T = AnyObj>(body: AnyObj): Promise<T> {
      const r = await api.post(`/api/profiles`, body);
      const data = unwrap(r);
      return (Array.isArray(data) ? data[0] : data) as T;
    },

    async update<T = AnyObj>(id: string, patch: AnyObj): Promise<T> {
  try {
    const r = await api.patch(`/api/profiles/${encodeURIComponent(id)}`, patch);
    return unwrap(r) as T;
  } catch (e: any) {
    if (e?.status === 404) {
      // ⬇️ DO NOT set _id here; let Mongo generate it. Use user_id to tie it back.
      const r2 = await api.post(`/api/profiles`, { user_id: id, ...patch });
      const data2 = unwrap(r2);
      return (Array.isArray(data2) ? data2[0] : data2) as T;
    }
    throw e;
  }
},


    async upsert<T = AnyObj>(idOrEmail: string, body: AnyObj): Promise<T> {
      if (idOrEmail.includes("@")) {
        const existing = await profiles.getByEmail<T>(idOrEmail);
        if (existing) {
          const nid = normalizeId(existing as AnyObj);
          return (await profiles.update(nid, body)) as T;
        }
        return (await profiles.create({ email: idOrEmail, ...body })) as T;
      }
      const existingById = await profiles.getById<T>(idOrEmail);
      if (existingById) return (await profiles.update(idOrEmail, body)) as T;
      return (await profiles.create({ _id: idOrEmail, user_id: idOrEmail, ...body })) as T;
    },
  };

  return { profiles };
}

// ------------------------------- Auth shim ---------------------------------
export interface ShimUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}
export interface ShimSession { user: ShimUser | null; }

function makeAuth(_api: AxiosInstance, db: ReturnType<typeof dbFacade>) {
  const SESSION_KEY = "mm_session";
  return {
    // LOGIN: look up user by email; if not found, try deterministic id
    async signIn(email: string, _password: string) {
      const em = (email || "").toLowerCase().trim();
      let profile = await db.profiles.getByEmail<any>(em);
      if (!profile) {
        const fallbackId = deriveIdFromEmail(em);
        profile = await db.profiles.getById<any>(fallbackId);
      }
      if (!profile) {
        const err: any = { status: 404, message: "User not found" };
        throw err;
      }
      const id = normalizeId(profile);
      const created = profile?.created_at || nowISO();
      const now = nowISO();
      const u: ShimUser = {
        id,
        email: (profile.email || em),
        created_at: created,
        updated_at: now,
        email_confirmed_at: profile?.email_confirmed_at || now,
        last_sign_in_at: now,
      };
      save(SESSION_KEY, { user: u });
      return { user: u };
    },

    // SIGN UP: create profile with deterministic _id & user_id to satisfy unique index
    async signUp(email: string, _password: string, metadata?: Record<string, any>) {
      const em = (email || "").toLowerCase().trim();

      const exists = await db.profiles.getByEmail<any>(em);
      if (exists) {
        const err: any = { status: 409, message: "User already registered" };
        throw err;
      }

      const now = nowISO();
      const id = deriveIdFromEmail(em);

      const payload = {
        _id: id,
        user_id: id,
        email: em,
        first_name: metadata?.first_name ?? "",
        last_name: metadata?.last_name ?? "",
        full_name:
          (metadata?.full_name ??
            `${metadata?.first_name ?? ""} ${metadata?.last_name ?? ""}`.trim()) ||
          em.split("@")[0],
        role: metadata?.role ?? "tutor",
        package: metadata?.package ?? "free",
        phone: metadata?.phone ?? "",
        is_active: true,
        created_at: now,
        updated_at: now,
        email_confirmed_at: now,
      };

      const created = await db.profiles.create(payload);
      const nid = normalizeId(created as AnyObj);
      const u: ShimUser = {
        id: nid,
        email: (created as any)?.email || em,
        created_at: (created as any)?.created_at || now,
        updated_at: now,
        email_confirmed_at: (created as any)?.email_confirmed_at || now,
        last_sign_in_at: null,
      };
      save(SESSION_KEY, { user: u });
      return { user: u };
    },

    async signOut() { clearKey(SESSION_KEY); },

    async getSession(): Promise<ShimSession | null> {
      return load<ShimSession>(SESSION_KEY);
    },

    onAuthStateChange(_cb: (evt: string, session: ShimSession | null) => void) {
      return { data: { subscription: { unsubscribe: () => void 0 } } };
    },

    async resetPassword(_email: string) { return { data: true, error: null }; },
    async updatePassword(_pwd: string) { return { data: true, error: null }; },
  };
}

// ------------------------------- Public API --------------------------------
function createClient(baseURL: string) {
  const api = makeAxios(baseURL);
  const db = dbFacade(api);
  const auth = makeAuth(api, db);

  return {
    from<T = any>(table: string) { return new QueryBuilder<T>(api, table); },
    rpc: <T = any>(name: string, args?: any) => callRpc<T>(api, name, args),
    _api: api,
    auth,
    db,
  };
}

const BASE_URL = getBaseUrl();
export const supabase = createClient(BASE_URL);

// ---- Realtime NOOP (Mongo mode) -------------------------------------------
// If your app still calls supabase.channel(...) we provide a safe stub so it
// doesn't crash. Set VITE_REALTIME=true later if you add real Realtime.
const REALTIME_ENABLED =
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_REALTIME === "true") ||
  (typeof process !== "undefined" &&
    ((process as any)?.env?.VITE_REALTIME === "true" ||
     (process as any)?.env?.NEXT_PUBLIC_REALTIME === "true"));

type Sub = { unsubscribe: () => void };
type Chan = {
  on: (..._args: any[]) => Chan;
  subscribe: () => Promise<{ data: { subscription: Sub } }>;
  unsubscribe: () => void;
};

function makeNoopChannel(name: string): Chan {
  const warn = (...args: any[]) =>
    console.warn("[Realtime:NOOP]", ...args);
  return {
    on() {
      warn(`channel("${name}").on(...) called — no realtime in Mongo mode`);
      return this;
    },
    async subscribe() {
      warn(`channel("${name}").subscribe() — returning inert subscription`);
      return { data: { subscription: { unsubscribe: () => warn(`channel("${name}").unsubscribe()`) } } };
    },
    unsubscribe() {
      warn(`channel("${name}").unsubscribe()`);
    },
  };
}

// Attach either a real channel (if you implement it later) or the NOOP.
if (!(supabase as any).channel) {
  (supabase as any).channel = (name: string) =>
    REALTIME_ENABLED
      ? makeNoopChannel(name) // replace with real impl when available
      : makeNoopChannel(name);
}


// Export a light db facade shaped how your app uses it
export const db = {
  profiles: {
    async getById<T = AnyObj>(id: string): Promise<T | null> {
      return await (supabase as any).db.profiles.getById<T>(id);
    },
    async getByUserId<T = AnyObj>(id: string): Promise<T | null> {
      return await (supabase as any).db.profiles.getById<T>(id);
    },
    async getByEmail<T = AnyObj>(email: string): Promise<T | null> {
      return await (supabase as any).db.profiles.getByEmail<T>(email);
    },
    async create<T = AnyObj>(body: AnyObj): Promise<T> {
      return await (supabase as any).db.profiles.create<T>(body);
    },
    async update<T = AnyObj>(id: string, patch: AnyObj): Promise<T> {
      return await (supabase as any).db.profiles.update<T>(id, patch);
    },
    async upsert<T = AnyObj>(idOrEmail: string, body: AnyObj): Promise<T> {
      return await (supabase as any).db.profiles.upsert<T>(idOrEmail, body);
    },
  },
};

// For compatibility with: import supabase, { auth, db } from "@/lib/supabase";

// ---------- Added: Safe realtime shims (Mongo mode & compatibility) ----------
type AnyChannel = { unsubscribe?: () => void } | any;

// Ensure supabase.realtime.removeChannel exists (no-op if in Mongo mode)
if (!((supabase as any).realtime && typeof (supabase as any).realtime.removeChannel === "function")) {
  (supabase as any).realtime = (supabase as any).realtime || {};
  (supabase as any).realtime.removeChannel = (ch: AnyChannel) => {
    try {
      return ch?.unsubscribe?.();
    } catch (e) {
      console.warn(" [Realtime:NOOP] removeChannel failed:", e);
      return { data: {}, error: null } as any;
    }
  };
}

// Legacy API: supabase.removeChannel(ch)
if (typeof (supabase as any).removeChannel !== "function") {
  (supabase as any).removeChannel = (ch: AnyChannel) => {
    try {
      const rt = (supabase as any).realtime;
      if (rt && typeof rt.removeChannel === "function") return rt.removeChannel(ch);
      return ch?.unsubscribe?.();
    } catch (e) {
      console.warn(" [Realtime:NOOP] removeChannel (legacy) failed:", e);
      return { data: {}, error: null } as any;
    }
  };
}

// Convenience helpers exported for callers that want explicit safety
export function safeSubscribe(channel: any) {
  try {
    return channel?.subscribe?.();
  } catch (e) {
    console.warn(" [Realtime:NOOP] subscribe error:", e);
    return { data: { subscription: null }, error: null } as any;
  }
}

export function safeRemoveChannel(ch?: any) {
  if (!ch) return;
  try {
    const sb: any = supabase as any;
    if (sb?.realtime?.removeChannel) return sb.realtime.removeChannel(ch);
    if (sb?.removeChannel) return sb.removeChannel(ch);
    return ch?.unsubscribe?.();
  } catch (e) {
    console.warn(" [Realtime:NOOP] safeRemoveChannel failed:", e);
  }
}

export const auth = (supabase as any).auth;
export default supabase;
