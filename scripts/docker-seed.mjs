// Docker-runtime equivalent of `pnpm run seed` (scripts/seed-user.ts), written
// in plain JS against only prod dependencies (no tsx/dotenv devDependencies in
// the slim runtime image). Run manually once, e.g.:
//   docker compose exec app node scripts/docker-seed.mjs
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { hash } from '@node-rs/argon2';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Minimal mirror of the `users` table from src/lib/server/db/schema.ts —
// duplicated (rather than imported) because this runs as plain Node ESM in
// the slim runtime image with no TypeScript loader available. Keep this in
// sync if the users table shape ever changes.
const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

async function main() {
	const email = process.env.SEED_EMAIL?.trim().toLowerCase();
	const password = process.env.SEED_PASSWORD;
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) throw new Error('DATABASE_URL is not set');
	if (!email || !password) throw new Error('SEED_EMAIL and SEED_PASSWORD must be set');
	if (password.length < 8) throw new Error('SEED_PASSWORD must be at least 8 characters');

	const filePath = databaseUrl.replace(/^file:/, '');
	if (filePath && filePath !== ':memory:') {
		mkdirSync(dirname(filePath), { recursive: true });
	}

	const client = createClient({ url: databaseUrl });
	await client.execute('PRAGMA foreign_keys = ON');
	const db = drizzle(client);

	const passwordHash = await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	const [existing] = await db.select().from(users).where(eq(users.email, email));

	if (existing) {
		await db.update(users).set({ passwordHash }).where(eq(users.id, existing.id));
		console.log(`[docker-seed] updated password for existing user: ${email}`);
	} else {
		await db.insert(users).values({
			id: crypto.randomUUID(),
			email,
			passwordHash,
			createdAt: new Date()
		});
		console.log(`[docker-seed] created user: ${email}`);
	}

	client.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
