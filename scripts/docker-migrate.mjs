// Runs on every container start (see docker-entrypoint.sh). Applies pending
// Drizzle migrations using drizzle-orm's own runtime migrator, NOT drizzle-kit —
// drizzle-kit is a devDependency and deliberately excluded from the slim
// runtime image, so this only needs prod deps (drizzle-orm, @libsql/client).
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const filePath = databaseUrl.replace(/^file:/, '');
if (filePath && filePath !== ':memory:') {
	mkdirSync(dirname(filePath), { recursive: true });
}

const client = createClient({ url: databaseUrl });
await client.execute('PRAGMA foreign_keys = ON');
const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });
console.log('[docker-migrate] migrations applied.');
client.close();
