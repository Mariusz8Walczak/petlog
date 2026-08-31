/**
 * Shared bounds for a single weight-log entry, used by both the "add
 * weight" and "edit weight" server actions so the rule lives in one place.
 */
// Exclusive lower bound — a weight of exactly 0 kg is never valid for a living animal.
export const MIN_WEIGHT_KG = 0;
// Inclusive upper bound — generous enough for every MVP species (cat/dog/rabbit).
export const MAX_WEIGHT_KG = 150;

export function isValidWeightKg(weightKg: number): boolean {
	return Number.isFinite(weightKg) && weightKg > MIN_WEIGHT_KG && weightKg <= MAX_WEIGHT_KG;
}
