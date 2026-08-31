import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { healthEvents, treatments, HEALTH_EVENT_STATUS } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import { suggestTreatments } from '$lib/server/domain/treatmentSuggestion';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);

	const symptomQuery = url.searchParams.get('symptom') ?? '';

	// All past (health event, treatment) pairs for THIS animal only — matching
	// across animals is out of scope per prd.md.
	const rows = await db
		.select({
			healthEventId: healthEvents.id,
			symptom: healthEvents.symptom,
			occurredAt: healthEvents.occurredAt,
			treatmentId: treatments.id,
			treatmentName: treatments.name,
			outcome: treatments.outcome
		})
		.from(treatments)
		.innerJoin(healthEvents, eq(treatments.healthEventId, healthEvents.id))
		.where(eq(healthEvents.animalId, animal.id));

	const suggestions = symptomQuery ? suggestTreatments(rows, symptomQuery) : [];

	return { animal, statuses: HEALTH_EVENT_STATUS, symptomQuery, suggestions };
};

export const actions: Actions = {
	create: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const formData = await request.formData();
		const occurredAt = String(formData.get('occurredAt') ?? '').trim();
		const symptom = String(formData.get('symptom') ?? '').trim();
		const diagnosis = String(formData.get('diagnosis') ?? '').trim();
		const status = String(formData.get('status') ?? 'ongoing');
		const notes = String(formData.get('notes') ?? '').trim();

		if (!occurredAt || !symptom) {
			return fail(400, { error: 'Podaj datę i objaw.' });
		}
		if (!HEALTH_EVENT_STATUS.includes(status as (typeof HEALTH_EVENT_STATUS)[number])) {
			return fail(400, { error: 'Nieprawidłowy status.' });
		}

		const [created] = await db
			.insert(healthEvents)
			.values({
				animalId: animal.id,
				occurredAt,
				symptom,
				diagnosis: diagnosis || null,
				status: status as (typeof HEALTH_EVENT_STATUS)[number],
				notes: notes || null
			})
			.returning();

		throw redirect(303, `/animals/${animal.id}/health-events/${created.id}`);
	}
};
