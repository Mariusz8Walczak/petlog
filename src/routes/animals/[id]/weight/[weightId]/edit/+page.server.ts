import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { weightLogs } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);
	const [entry] = await db
		.select()
		.from(weightLogs)
		.where(and(eq(weightLogs.id, params.weightId), eq(weightLogs.animalId, animal.id)));
	if (!entry) throw error(404, 'Nie znaleziono wpisu wagi.');
	return { animal, entry };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const formData = await request.formData();
		const weightKg = Number(formData.get('weightKg'));
		const measuredAt = String(formData.get('measuredAt') ?? '').trim();
		const note = String(formData.get('note') ?? '').trim();

		if (!measuredAt || !Number.isFinite(weightKg) || weightKg <= 0) {
			return fail(400, { error: 'Podaj poprawną wagę i datę pomiaru.' });
		}

		await db
			.update(weightLogs)
			.set({ weightKg, measuredAt, note: note || null })
			.where(and(eq(weightLogs.id, params.weightId), eq(weightLogs.animalId, animal.id)));

		throw redirect(303, `/animals/${animal.id}`);
	}
};
