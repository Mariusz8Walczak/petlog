import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { animals, SPECIES } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const ownerId = locals.user!.id;
	const list = await db
		.select()
		.from(animals)
		.where(eq(animals.ownerId, ownerId))
		.orderBy(desc(animals.createdAt));
	return { animals: list, species: SPECIES };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const ownerId = locals.user!.id;
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const species = String(formData.get('species') ?? '');
		const breed = String(formData.get('breed') ?? '').trim();
		const birthDate = String(formData.get('birthDate') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Podaj imię zwierzęcia.' });
		}
		if (!SPECIES.includes(species as (typeof SPECIES)[number])) {
			return fail(400, { error: 'Nieprawidłowy gatunek.' });
		}

		await db.insert(animals).values({
			ownerId,
			name,
			species: species as (typeof SPECIES)[number],
			breed: breed || null,
			birthDate: birthDate || null
		});

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const ownerId = locals.user!.id;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { error: 'Brak id.' });

		await db.delete(animals).where(and(eq(animals.id, id), eq(animals.ownerId, ownerId)));
		return { success: true };
	}
};
