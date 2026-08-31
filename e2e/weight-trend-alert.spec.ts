import { test, expect } from '@playwright/test';

/**
 * Flagship e2e test — covers test-plan.md risk #1 from the user's perspective:
 * "the owner won't notice a dangerous weight trend because comparing entries
 * by hand is error-prone." A logged-in user creates an animal, logs two
 * weight entries ~30 days apart with a >10% drop, and must see the `alert`
 * badge on the animal page without doing any comparison math themselves.
 */

const SEED_EMAIL = process.env.SEED_EMAIL ?? 'owner@example.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'change-me-please';

function isoDateDaysAgo(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d.toISOString().slice(0, 10);
}

test('owner sees an alert badge after a >10% weight drop over ~30 days', async ({ page }) => {
	// 1. Log in as the seeded household user.
	await page.goto('/login');
	await page.getByLabel('E-mail').fill(SEED_EMAIL);
	await page.getByLabel('Hasło').fill(SEED_PASSWORD);
	await page.getByRole('button', { name: 'Zaloguj' }).click();
	await expect(page).toHaveURL(/\/animals$/);

	// 2. Create a new animal.
	const animalName = `TestCat ${Date.now()}`;
	await page.getByLabel('Imię').fill(animalName);
	await page.getByLabel('Gatunek').selectOption('cat');
	await page.getByRole('button', { name: 'Dodaj', exact: true }).click();

	const animalLink = page.getByRole('link', { name: new RegExp(animalName) });
	await expect(animalLink).toBeVisible();
	await animalLink.click();
	await expect(page).toHaveURL(/\/animals\/[^/]+$/);

	// Before any weight entries: trend badge should say "insufficient data".
	const badge = page.getByTestId('weight-trend-badge');
	await expect(badge).toHaveAttribute('data-trend', 'insufficient_data');

	// 3. Add two weight entries ~30 days apart with a 15% drop (4.0kg -> 3.4kg).
	const baselineDate = isoDateDaysAgo(30);
	const latestDate = isoDateDaysAgo(0);

	await page.getByLabel('Data pomiaru').fill(baselineDate);
	await page.getByLabel('Waga (kg)').fill('4.0');
	await page.getByRole('button', { name: 'Dodaj wpis' }).click();
	await expect(page.getByTestId('weight-list')).toContainText(baselineDate);

	await page.getByLabel('Data pomiaru').fill(latestDate);
	await page.getByLabel('Waga (kg)').fill('3.4');
	await page.getByRole('button', { name: 'Dodaj wpis' }).click();
	await expect(page.getByTestId('weight-list')).toContainText(latestDate);

	// 4. The alert badge must be visible next to the weight history — this is
	// the whole point: the user doesn't have to compare the numbers themselves.
	await expect(badge).toBeVisible();
	await expect(badge).toHaveAttribute('data-trend', 'alert');
	await expect(badge).toContainText('Alarm');
});
