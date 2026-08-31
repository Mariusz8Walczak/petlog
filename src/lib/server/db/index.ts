import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Ensure the parent directory of the SQLite file exists (e.g. ./data locally,
// or the /app/data volume mount in Docker) before libsql tries to open it.
const filePath = env.DATABASE_URL.replace(/^file:/, '');
if (filePath && filePath !== ':memory:') {
	mkdirSync(dirname(filePath), { recursive: true });
}

const client = createClient({ url: env.DATABASE_URL });

// SQLite disables FK enforcement by default per-connection; the schema relies
// on ON DELETE CASCADE (e.g. deleting an animal cascades to its weight logs,
// health events, and their treatments), so this must be turned on explicitly.
await client.execute('PRAGMA foreign_keys = ON');

export const db = drizzle(client, { schema });
