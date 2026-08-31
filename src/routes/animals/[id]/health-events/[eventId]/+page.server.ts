import { error, fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { healthEvents, treatments } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import type { Actions, PageServerLoad } from './$types';

async function getOwnedHealthEvent(animalId: string, eventId: string) {
	const [event] = await db
		.select()
		.from(healthEvents)
		.where(and(eq(healthEvents.id, eventId), eq(healthEvents.animalId, animalId)));
	if (!event) throw error(404, 'Nie znaleziono zdarzenia zdrowotnego.');
	return event;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);
	const event = await getOwnedHealthEvent(animal.id, params.eventId);

	const eventTreatments = await db
		.select()
		.from(treatments)
		.where(eq(treatments.healthEventId, event.id))
		.orderBy(desc(treatments.startDate));

	return { animal, event, treatments: eventTreatments };
};

export const actions: Actions = {
	deleteEvent: async ({ params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const event = await getOwnedHealthEvent(animal.id, params.eventId);
		await db.delete(healthEvents).where(eq(healthEvents.id, event.id));
		throw redirect(303, `/animals/${animal.id}`);
	},

	deleteTreatment: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const event = await getOwnedHealthEvent(animal.id, params.eventId);
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'Brak id.' });

		await db
			.delete(treatments)
			.where(and(eq(treatments.id, id), eq(treatments.healthEventId, event.id)));
		return { success: true };
	}
};
