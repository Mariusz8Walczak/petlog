import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { healthEvents, treatments, TREATMENT_OUTCOME } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import type { Actions, PageServerLoad } from './$types';

async function getOwnedTreatment(animalId: string, eventId: string, treatmentId: string) {
	const [event] = await db
		.select()
		.from(healthEvents)
		.where(and(eq(healthEvents.id, eventId), eq(healthEvents.animalId, animalId)));
	if (!event) throw error(404, 'Nie znaleziono zdarzenia zdrowotnego.');

	const [treatment] = await db
		.select()
		.from(treatments)
		.where(and(eq(treatments.id, treatmentId), eq(treatments.healthEventId, event.id)));
	if (!treatment) throw error(404, 'Nie znaleziono leczenia.');

	return { event, treatment };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);
	const { event, treatment } = await getOwnedTreatment(animal.id, params.eventId, params.treatmentId);
	return { animal, event, treatment, outcomes: TREATMENT_OUTCOME };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const { treatment } = await getOwnedTreatment(animal.id, params.eventId, params.treatmentId);

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

		await db
			.update(treatments)
			.set({
				name,
				dosage: dosage || null,
				startDate,
				endDate: endDate || null,
				outcome: outcome as (typeof TREATMENT_OUTCOME)[number],
				notes: notes || null
			})
			.where(eq(treatments.id, treatment.id));

		throw redirect(303, `/animals/${animal.id}/health-events/${params.eventId}`);
	}
};
