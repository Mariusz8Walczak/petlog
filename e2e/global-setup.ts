import { execSync } from 'node:child_process';

/**
 * Runs migrate + seed once before the e2e suite (so the seeded household
 * user exists), as two separate child_process calls from a single Node
 * process. Deliberately does NOT also run the build here: `pnpm run test:e2e`
 * runs `pnpm run build` as its own fully-completed step before `playwright
 * test` even starts (see package.json) — interleaving the build with
 * Playwright's own process orchestration caused an intermittent bug on this
 * machine where the preview server served (or a leftover process crashed on)
 * stale/partially-written asset filenames from a slightly earlier build.
 */
export default function globalSetup() {
	const steps = ['db:migrate', 'seed'];
	for (const step of steps) {
		execSync(`pnpm run ${step}`, { stdio: 'inherit' });
	}
}
