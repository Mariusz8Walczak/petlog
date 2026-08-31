/**
 * Creates (or updates the password of) the single household account, from
 * SEED_EMAIL / SEED_PASSWORD env vars. There is no public registration UI —
 * this script is the only way to create a PetLog user (see prd.md "Auth").
 *
 * Usage: pnpm run seed
 */
import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { users } from '../src/lib/server/db/schema';

async function main() {
	const email = process.env.SEED_EMAIL?.trim().toLowerCase();
	const password = process.env.SEED_PASSWORD;
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) throw new Error('DATABASE_URL is not set (check .env)');
	if (!email || !password) {
		throw new Error('SEED_EMAIL and SEED_PASSWORD must be set (check .env / .env.example)');
	}
	if (password.length < 8) {
		throw new Error('SEED_PASSWORD must be at least 8 characters');
	}

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
		console.log(`Updated password for existing user: ${email}`);
	} else {
		await db.insert(users).values({ email, passwordHash });
		console.log(`Created user: ${email}`);
	}

	client.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
