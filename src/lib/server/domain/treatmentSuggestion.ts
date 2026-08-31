/**
 * Treatment suggestion — PRD "Reguła biznesowa — podpowiedź z historii leczenia".
 *
 * Pure, DB-free, unit-testable. Given one animal's past health events (each with
 * its treatments already attached) and a new symptom string being entered, finds
 * past treatments for that SAME animal whose linked health event's symptom text
 * case-insensitively contains (or is contained by) the new symptom, and ranks
 * `helped` outcomes first, then most recent first.
 *
 * Known MVP simplification (documented in prd.md): same-animal only, plain
 * substring match instead of semantic search.
 */

import type { TreatmentOutcome } from '../db/schema';

export interface TreatmentSuggestionInput {
	healthEventId: string;
	symptom: string;
	occurredAt: string | Date;
	treatmentId: string;
	treatmentName: string;
	outcome: TreatmentOutcome;
}

export interface SuggestedTreatment {
	treatmentId: string;
	treatmentName: string;
	outcome: TreatmentOutcome;
	healthEventId: string;
	symptom: string;
	occurredAt: string | Date;
}

function toDate(value: string | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

function normalize(text: string): string {
	return text.trim().toLowerCase();
}

/**
 * @param pastRecords Flattened list of (health event, treatment) pairs for ONE
 *   animal only — the caller is responsible for scoping to a single animal
 *   (e.g. `WHERE health_events.animal_id = ?`), since matching across animals
 *   is explicitly out of scope for the MVP.
 * @param newSymptom The symptom text being typed into the "add health event" form.
 */
export function suggestTreatments(
	pastRecords: TreatmentSuggestionInput[],
	newSymptom: string
): SuggestedTreatment[] {
	const needle = normalize(newSymptom);
	if (!needle) return [];

	const matches = pastRecords.filter((record) => {
		const haystack = normalize(record.symptom);
		if (!haystack) return false;
		return haystack.includes(needle) || needle.includes(haystack);
	});

	const outcomeRank = (outcome: TreatmentOutcome): number => (outcome === 'helped' ? 0 : 1);

	matches.sort((a, b) => {
		const rankDiff = outcomeRank(a.outcome) - outcomeRank(b.outcome);
		if (rankDiff !== 0) return rankDiff;
		return toDate(b.occurredAt).getTime() - toDate(a.occurredAt).getTime();
	});

	return matches.map(({ treatmentId, treatmentName, outcome, healthEventId, symptom, occurredAt }) => ({
		treatmentId,
		treatmentName,
		outcome,
		healthEventId,
		symptom,
		occurredAt
	}));
}
