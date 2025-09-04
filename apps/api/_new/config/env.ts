import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';

const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/api/.env'),
  resolve(new URL('../../.env', import.meta.url).pathname),
];
for (const p of candidates) { if (existsSync(p)) { config({ path: p }); break; } }

export const Env = z.object({
  PORT: z.coerce.number().default(4003),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),
});
export const env = Env.parse(process.env);
