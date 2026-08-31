import { describe, expect, it } from 'vitest';
import { suggestTreatments, type TreatmentSuggestionInput } from './treatmentSuggestion';

function record(overrides: Partial<TreatmentSuggestionInput>): TreatmentSuggestionInput {
	return {
		healthEventId: 'event-1',
		symptom: 'wymioty',
		occurredAt: '2026-01-01',
		treatmentId: 'treatment-1',
		treatmentName: 'Leczenie A',
		outcome: 'unknown',
		...overrides
	};
}

describe('suggestTreatments', () => {
	it('matches case-insensitively on substring', () => {
		const records = [record({ symptom: 'Wymioty po jedzeniu' })];
		expect(suggestTreatments(records, 'wymioty')).toHaveLength(1);
		expect(suggestTreatments(records, 'WYMIOTY')).toHaveLength(1);
	});

	it('returns no matches for an unrelated symptom', () => {
		const records = [record({ symptom: 'wymioty' })];
		expect(suggestTreatments(records, 'kulawizna')).toHaveLength(0);
	});

	it('only returns records the caller scoped to the same animal (does not itself filter by animal)', () => {
		// The function receives records already scoped to one animal by the caller
		// (see prd.md: cross-animal matching is out of MVP scope). Simulate the
		// caller passing only animal A's records and confirm nothing extra leaks in.
		const animalARecords = [
			record({ healthEventId: 'a-event', symptom: 'wymioty', treatmentId: 't-a' })
		];
		const result = suggestTreatments(animalARecords, 'wymioty');
		expect(result.map((r) => r.treatmentId)).toEqual(['t-a']);
	});

	it('ranks helped outcome first regardless of recency', () => {
		const records = [
			record({ treatmentId: 't-old-helped', outcome: 'helped', occurredAt: '2025-01-01' }),
			record({ treatmentId: 't-new-noeffect', outcome: 'no_effect', occurredAt: '2026-01-01' })
		];
		const result = suggestTreatments(records, 'wymioty');
		expect(result.map((r) => r.treatmentId)).toEqual(['t-old-helped', 't-new-noeffect']);
	});

	it('within the same outcome tier, sorts most recent first', () => {
		const records = [
			record({ treatmentId: 't-1', outcome: 'unknown', occurredAt: '2025-06-01' }),
			record({ treatmentId: 't-2', outcome: 'unknown', occurredAt: '2026-01-01' }),
			record({ treatmentId: 't-3', outcome: 'unknown', occurredAt: '2025-01-01' })
		];
		const result = suggestTreatments(records, 'wymioty');
		expect(result.map((r) => r.treatmentId)).toEqual(['t-2', 't-1', 't-3']);
	});

	it('combines outcome ranking and recency: helped-first, then newest-first within each tier', () => {
		const records = [
			record({ treatmentId: 't-helped-old', outcome: 'helped', occurredAt: '2025-01-01' }),
			record({ treatmentId: 't-helped-new', outcome: 'helped', occurredAt: '2026-01-01' }),
			record({ treatmentId: 't-worsened', outcome: 'worsened', occurredAt: '2026-06-01' })
		];
		const result = suggestTreatments(records, 'wymioty');
		expect(result.map((r) => r.treatmentId)).toEqual([
			't-helped-new',
			't-helped-old',
			't-worsened'
		]);
	});

	it('returns an empty array for an empty/blank new symptom', () => {
		const records = [record({ symptom: 'wymioty' })];
		expect(suggestTreatments(records, '')).toHaveLength(0);
		expect(suggestTreatments(records, '   ')).toHaveLength(0);
	});
});
