// drizzle-kit's `migrate`/`push`/`studio` commands connect straight to the
// SQLite file path from DATABASE_URL without creating its parent directory
// first (unlike our own db/index.ts, which does). Run this before those
// commands so a fresh clone doesn't fail with "unable to open connection".
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (url) {
	const filePath = url.replace(/^file:/, '');
	if (filePath && filePath !== ':memory:') {
		mkdirSync(dirname(filePath), { recursive: true });
	}
}
