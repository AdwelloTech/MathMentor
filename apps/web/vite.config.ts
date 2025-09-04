import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, '../../'), '');
  const webEnv  = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...webEnv };
  const target = env.VITE_API_URL || 'http://localhost:4003';

  return {
    root: __dirname,
    plugins: [react()],
    server: {
      port: 3000, strictPort: true, open: true,
      proxy: { '/api': { target, changeOrigin: true, rewrite: p=>p.replace(/^\/api/, '') } }
    },
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    }
  };
});
