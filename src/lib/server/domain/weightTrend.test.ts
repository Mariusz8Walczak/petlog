import { describe, expect, it } from 'vitest';
import { computeWeightTrend } from './weightTrend';

describe('computeWeightTrend', () => {
	it('returns insufficient_data with fewer than 2 entries', () => {
		expect(computeWeightTrend([]).status).toBe('insufficient_data');
		expect(computeWeightTrend([{ measuredAt: '2026-01-01', weightKg: 4 }]).status).toBe('insufficient_data');
	});

	it('flags alert on a >10% drop over ~30 days', () => {
		// 4.0kg -> 3.4kg is a 15% drop.
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-01', weightKg: 4.0 },
			{ measuredAt: '2026-01-31', weightKg: 3.4 }
		]);
		expect(result.status).toBe('alert');
		expect(result.percentChange).toBeCloseTo(-15, 5);
	});

	it('flags alert on a >10% gain over ~30 days', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-01', weightKg: 4.0 },
			{ measuredAt: '2026-01-31', weightKg: 4.6 } // +15%
		]);
		expect(result.status).toBe('alert');
	});

	it('classifies a change within ±5% as stable', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-01', weightKg: 4.0 },
			{ measuredAt: '2026-01-31', weightKg: 4.1 } // +2.5%
		]);
		expect(result.status).toBe('stable');
	});

	it('classifies a change of exactly ±5% as stable (boundary is inclusive)', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-01', weightKg: 4.0 },
			{ measuredAt: '2026-01-31', weightKg: 4.2 } // exactly +5%
		]);
		expect(result.status).toBe('stable');
	});

	it('classifies a change between 5% and 10% as watch', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-01', weightKg: 4.0 },
			{ measuredAt: '2026-01-31', weightKg: 4.3 } // +7.5%
		]);
		expect(result.status).toBe('watch');
	});

	it('classifies a negative change between 5% and 10% as watch', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-01', weightKg: 4.0 },
			{ measuredAt: '2026-01-31', weightKg: 3.7 } // -7.5%
		]);
		expect(result.status).toBe('watch');
	});

	it('picks the entry nearest to 30 days before the latest as the baseline, not just the first', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2025-11-01', weightKg: 10 }, // far too old — should be ignored
			{ measuredAt: '2026-01-01', weightKg: 4.0 }, // exactly 30 days before latest — this is the baseline
			{ measuredAt: '2026-01-15', weightKg: 4.05 }, // closer in time, but not the ~30-day window
			{ measuredAt: '2026-01-31', weightKg: 3.4 } // latest, 15% below the 2026-01-01 baseline
		]);
		expect(result.baseline?.measuredAt).toBe('2026-01-01');
		expect(result.status).toBe('alert');
	});

	it('ignores out-of-order input by sorting on measuredAt', () => {
		const result = computeWeightTrend([
			{ measuredAt: '2026-01-31', weightKg: 3.4 },
			{ measuredAt: '2026-01-01', weightKg: 4.0 }
		]);
		expect(result.latest?.measuredAt).toBe('2026-01-31');
		expect(result.status).toBe('alert');
	});
});
