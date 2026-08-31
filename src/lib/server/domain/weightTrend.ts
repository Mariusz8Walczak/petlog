/**
 * Weight trend detection — PRD "Reguła biznesowa — detekcja trendu wagi".
 *
 * Pure, DB-free, unit-testable. Compares the latest weight entry against the
 * nearest entry ~30 days earlier and classifies the percentage change.
 */

export type WeightTrendStatus = 'stable' | 'watch' | 'alert' | 'insufficient_data';

export interface WeightPoint {
	measuredAt: string | Date;
	weightKg: number;
}

export interface WeightTrendResult {
	status: WeightTrendStatus;
	/** Percentage change, positive = gain, negative = loss. Undefined when insufficient_data. */
	percentChange?: number;
	latest?: WeightPoint;
	/** The comparison point nearest to 30 days before `latest`. */
	baseline?: WeightPoint;
}

const TARGET_WINDOW_DAYS = 30;
const STABLE_THRESHOLD_PCT = 5;
const ALERT_THRESHOLD_PCT = 10;

function toDate(value: string | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

function daysBetween(a: Date, b: Date): number {
	const msPerDay = 1000 * 60 * 60 * 24;
	return Math.abs(a.getTime() - b.getTime()) / msPerDay;
}

/**
 * Computes the weight trend for one animal from its full weight log history.
 *
 * Algorithm:
 * 1. The latest entry (by `measuredAt`) is the current weight.
 * 2. Among all earlier entries, pick the one whose `measuredAt` is closest to
 *    exactly 30 days before the latest entry's date (nearest-neighbor, not a
 *    strict "closest to 30 days ago" cutoff — this tolerates real-world
 *    logging that isn't exactly on a 30-day cadence).
 * 3. status = |percent change| <= 5% -> stable, <= 10% -> watch, > 10% -> alert.
 *
 * Returns `insufficient_data` when there are fewer than 2 entries.
 */
export function computeWeightTrend(logs: WeightPoint[]): WeightTrendResult {
	if (logs.length < 2) {
		return { status: 'insufficient_data' };
	}

	const sorted = [...logs].sort(
		(a, b) => toDate(a.measuredAt).getTime() - toDate(b.measuredAt).getTime()
	);
	const latest = sorted[sorted.length - 1];
	const latestDate = toDate(latest.measuredAt);

	const earlierEntries = sorted.slice(0, -1);

	// Pick the earlier entry whose distance from the ideal target date
	// (latest - 30 days) is smallest.
	const targetDate = new Date(latestDate.getTime() - TARGET_WINDOW_DAYS * 24 * 60 * 60 * 1000);

	let baseline = earlierEntries[0];
	let bestDiff = daysBetween(toDate(baseline.measuredAt), targetDate);
	for (const entry of earlierEntries) {
		const diff = daysBetween(toDate(entry.measuredAt), targetDate);
		if (diff < bestDiff) {
			bestDiff = diff;
			baseline = entry;
		}
	}

	if (baseline.weightKg === 0) {
		return { status: 'insufficient_data', latest, baseline };
	}

	const percentChange = ((latest.weightKg - baseline.weightKg) / baseline.weightKg) * 100;
	const absChange = Math.abs(percentChange);
	// Guard against floating-point noise around exact boundary values
	// (e.g. 4.0 -> 4.2 should read as exactly +5%, not +5.000000000000001%).
	const EPSILON = 1e-9;

	let status: WeightTrendStatus;
	if (absChange > ALERT_THRESHOLD_PCT + EPSILON) {
		status = 'alert';
	} else if (absChange > STABLE_THRESHOLD_PCT + EPSILON) {
		status = 'watch';
	} else {
		status = 'stable';
	}

	return { status, percentChange, latest, baseline };
}
