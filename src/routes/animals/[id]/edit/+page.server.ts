import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { animals, SPECIES } from '$lib/server/db/schema';
import { getOwnedAnimal } from '$lib/server/data-access/getOwnedAnimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const animal = await getOwnedAnimal(params.id, locals.user!.id);
	return { animal, species: SPECIES };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const animal = await getOwnedAnimal(params.id, locals.user!.id);
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const species = String(formData.get('species') ?? '');
		const breed = String(formData.get('breed') ?? '').trim();
		const birthDate = String(formData.get('birthDate') ?? '').trim();

		if (!name) return fail(400, { error: 'Podaj imię zwierzęcia.' });
		if (!SPECIES.includes(species as (typeof SPECIES)[number])) {
			return fail(400, { error: 'Nieprawidłowy gatunek.' });
		}

		await db
			.update(animals)
			.set({
				name,
				species: species as (typeof SPECIES)[number],
				breed: breed || null,
				birthDate: birthDate || null
			})
			.where(eq(animals.id, animal.id));

		throw redirect(303, `/animals/${animal.id}`);
	}
};
