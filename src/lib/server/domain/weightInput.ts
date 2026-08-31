/**
 * Shared bounds for a single weight-log entry, used by both the "add
 * weight" and "edit weight" server actions so the rule lives in one place.
 */
export const MIN_WEIGHT_KG = 0;
export const MAX_WEIGHT_KG = 150; // generous upper bound covering every MVP species (cat/dog/rabbit)

export function isValidWeightKg(weightKg: number): boolean {
	return Number.isFinite(weightKg) && weightKg > MIN_WEIGHT_KG && weightKg <= MAX_WEIGHT_KG;
}
