import { defineConfig } from '@playwright/test';

export default defineConfig({
	// Migrate + seed the DB before booting the production build, so the seeded
	// household user (SEED_EMAIL/SEED_PASSWORD) always exists for the e2e login step.
	webServer: {
		command: 'pnpm run db:migrate && pnpm run seed && pnpm run build && pnpm run preview',
		port: 4173,
		timeout: 120_000
	},
	// e2e specs live under ./e2e (outside src/), so this can use Playwright's
	// default *.spec.ts convention without colliding with Vitest, which only
	// scans src/**/*.{test,spec}.ts.
	testDir: './e2e'
});
