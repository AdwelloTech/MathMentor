// Tiny supabase-like client that points to the Mongo API
export function createClient(baseUrl){
  const base = baseUrl.replace(/\/$/, '');
  function headers(){ return { 'Content-Type':'application/json' }; }
  return {
    from(table){
      const url = `${base}/api/${table}`;
      return {
        async select({ q=null, limit=50, skip=0, sort=null }={}){
          const params = new URLSearchParams();
          if (q) params.set('q', JSON.stringify(q));
          if (sort) params.set('sort', JSON.stringify(sort));
          if (limit) params.set('limit', String(limit));
          if (skip) params.set('skip', String(skip));
          const res = await fetch(`${url}?${params.toString()}`);
          const data = await res.json();
          return { data, error: res.ok ? null : data };
        },
        async insert(rows){
          const res = await fetch(url, { method:'POST', headers: headers(), body: JSON.stringify(rows) });
          const data = await res.json().catch(()=>null);
          return { data, error: res.ok ? null : data };
        },
        async update(patch, id){
          const res = await fetch(`${url}/${id}`, { method:'PATCH', headers: headers(), body: JSON.stringify(patch) });
          const data = await res.json().catch(()=>null);
          return { data, error: res.ok ? null : data };
        },
        async delete(id){
          const res = await fetch(`${url}/${id}`, { method:'DELETE' });
          return { data: null, error: res.ok ? null : await res.text() };
        },
      }
    }
  }
}
export const supabase = createClient((typeof process!=='undefined' && (process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL)) || 'http://localhost:8080');
