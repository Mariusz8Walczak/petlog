import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { healthEvents, treatments, TREATMENT_OUTCOME } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);
	const [event] = await db
		.select()
		.from(healthEvents)
		.where(and(eq(healthEvents.id, params.eventId), eq(healthEvents.animalId, animal.id)));
	if (!event) throw error(404, 'Nie znaleziono zdarzenia zdrowotnego.');
	return { animal, event, outcomes: TREATMENT_OUTCOME };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const [event] = await db
			.select()
			.from(healthEvents)
			.where(and(eq(healthEvents.id, params.eventId), eq(healthEvents.animalId, animal.id)));
		if (!event) throw error(404, 'Nie znaleziono zdarzenia zdrowotnego.');

		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const dosage = String(formData.get('dosage') ?? '').trim();
		const startDate = String(formData.get('startDate') ?? '').trim();
		const endDate = String(formData.get('endDate') ?? '').trim();
		const outcome = String(formData.get('outcome') ?? 'unknown');
		const notes = String(formData.get('notes') ?? '').trim();

		if (!name || !startDate) return fail(400, { error: 'Podaj nazwę leczenia i datę rozpoczęcia.' });
		if (!TREATMENT_OUTCOME.includes(outcome as (typeof TREATMENT_OUTCOME)[number])) {
			return fail(400, { error: 'Nieprawidłowy skutek.' });
		}

		await db.insert(treatments).values({
			healthEventId: event.id,
			name,
			dosage: dosage || null,
			startDate,
			endDate: endDate || null,
			outcome: outcome as (typeof TREATMENT_OUTCOME)[number],
			notes: notes || null
		});

		throw redirect(303, `/animals/${animal.id}/health-events/${event.id}`);
	}
};
