import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { healthEvents, HEALTH_EVENT_STATUS } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);
	const [event] = await db
		.select()
		.from(healthEvents)
		.where(and(eq(healthEvents.id, params.eventId), eq(healthEvents.animalId, animal.id)));
	if (!event) throw error(404, 'Nie znaleziono zdarzenia zdrowotnego.');
	return { animal, event, statuses: HEALTH_EVENT_STATUS };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const formData = await request.formData();
		const occurredAt = String(formData.get('occurredAt') ?? '').trim();
		const symptom = String(formData.get('symptom') ?? '').trim();
		const diagnosis = String(formData.get('diagnosis') ?? '').trim();
		const status = String(formData.get('status') ?? 'ongoing');
		const notes = String(formData.get('notes') ?? '').trim();

		if (!occurredAt || !symptom) return fail(400, { error: 'Podaj datę i objaw.' });
		if (!HEALTH_EVENT_STATUS.includes(status as (typeof HEALTH_EVENT_STATUS)[number])) {
			return fail(400, { error: 'Nieprawidłowy status.' });
		}

		await db
			.update(healthEvents)
			.set({
				occurredAt,
				symptom,
				diagnosis: diagnosis || null,
				status: status as (typeof HEALTH_EVENT_STATUS)[number],
				notes: notes || null
			})
			.where(and(eq(healthEvents.id, params.eventId), eq(healthEvents.animalId, animal.id)));

		throw redirect(303, `/animals/${animal.id}/health-events/${params.eventId}`);
	}
};
