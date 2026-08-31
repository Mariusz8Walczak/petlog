import { describe, expect, it } from 'vitest';
import { isValidWeightKg, MAX_WEIGHT_KG, MIN_WEIGHT_KG } from './weightInput';

describe('isValidWeightKg', () => {
	it('accepts a typical weight', () => {
		expect(isValidWeightKg(4.2)).toBe(true);
	});

	it('rejects zero and negative values', () => {
		expect(isValidWeightKg(0)).toBe(false);
		expect(isValidWeightKg(-1)).toBe(false);
	});

	it('rejects values above the upper bound (likely a typo, e.g. 420 instead of 4.2)', () => {
		expect(isValidWeightKg(MAX_WEIGHT_KG + 0.1)).toBe(false);
	});

	it('accepts the boundary values', () => {
		expect(isValidWeightKg(MIN_WEIGHT_KG + 0.01)).toBe(true);
		expect(isValidWeightKg(MAX_WEIGHT_KG)).toBe(true);
	});

	it('rejects non-finite input', () => {
		expect(isValidWeightKg(NaN)).toBe(false);
		expect(isValidWeightKg(Infinity)).toBe(false);
	});
});
