// Smart API fetch: uses /api proxy when VITE_API_URL is empty, otherwise uses absolute URL.
// Adds small timeout + error logging to avoid infinite spinners.
export async function api(path: string, init?: RequestInit) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const useProxy = !base;
  const url = useProxy ? `/api${path}` : `${base}${path}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const txt = await res.text().catch(()=>''); 
      console.error('[api]', res.status, res.statusText, url, txt);
      throw new Error(`API ${res.status} ${res.statusText}`);
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  } catch (err) {
    console.error('[api] fetch failed', url, err);
    throw err;
  } finally {
    clearTimeout(id);
  }
}
