import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
	// Migrate + seed the DB, then build — once, before the suite (see
	// e2e/global-setup.ts for why this isn't chained into webServer.command).
	globalSetup: './e2e/global-setup.ts',
	webServer: {
		command: 'pnpm run preview',
		// Explicit IPv4 loopback URL (not `port:`, which polls "localhost" —
		// on this dev machine `vite preview` binds only the IPv6 loopback
		// [::1], and "localhost" resolves to the IPv4 127.0.0.1 first, so the
		// health check would connect-fail even though the server is up).
		url: baseURL,
		timeout: 60_000,
		// Never reuse a server left running from a previous run: globalSetup
		// just rebuilt the app, and a stale preview process serving the old
		// build's hashed asset filenames causes broken (404) asset loads.
		reuseExistingServer: false
	},
	use: { baseURL },
	// e2e specs live under ./e2e (outside src/), so this can use Playwright's
	// default *.spec.ts convention without colliding with Vitest, which only
	// scans src/**/*.{test,spec}.ts.
	testDir: './e2e'
});
