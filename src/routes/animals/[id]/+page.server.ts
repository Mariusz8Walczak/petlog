import { fail, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { animals, healthEvents, weightLogs } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import { computeWeightTrend } from '$lib/server/domain/weightTrend';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const ownerId = locals.user!.id;
	const animal = await getOwnedAnimal(params.id, ownerId);

	const [weights, events] = await Promise.all([
		db
			.select()
			.from(weightLogs)
			.where(eq(weightLogs.animalId, animal.id))
			.orderBy(asc(weightLogs.measuredAt)),
		db
			.select()
			.from(healthEvents)
			.where(eq(healthEvents.animalId, animal.id))
			.orderBy(desc(healthEvents.occurredAt))
	]);

	const trend = computeWeightTrend(
		weights.map((w) => ({ measuredAt: w.measuredAt, weightKg: w.weightKg }))
	);

	return { animal, weights, events, trend };
};

export const actions: Actions = {
	addWeight: async ({ request, params, locals }) => {
		const ownerId = locals.user!.id;
		const animal = await getOwnedAnimal(params.id, ownerId);

		const formData = await request.formData();
		const weightKg = Number(formData.get('weightKg'));
		const measuredAt = String(formData.get('measuredAt') ?? '').trim();
		const note = String(formData.get('note') ?? '').trim();

		if (!measuredAt || !Number.isFinite(weightKg) || weightKg <= 0) {
			return fail(400, { error: 'Podaj poprawną wagę i datę pomiaru.' });
		}

		await db.insert(weightLogs).values({
			animalId: animal.id,
			weightKg,
			measuredAt,
			note: note || null
		});

		return { success: true };
	},

	deleteWeight: async ({ request, params, locals }) => {
		const ownerId = locals.user!.id;
		const animal = await getOwnedAnimal(params.id, ownerId);

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'Brak id.' });

		await db
			.delete(weightLogs)
			.where(and(eq(weightLogs.id, id), eq(weightLogs.animalId, animal.id)));
		return { success: true };
	},

	deleteAnimal: async ({ params, locals }) => {
		const ownerId = locals.user!.id;
		const animal = await getOwnedAnimal(params.id, ownerId);
		await db.delete(animals).where(eq(animals.id, animal.id));
		throw redirect(303, '/animals');
	}
};
