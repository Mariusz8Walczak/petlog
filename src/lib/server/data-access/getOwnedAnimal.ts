import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { animals } from '../db/schema';
import type { Animal } from '../db/schema';

/**
 * Loads an animal by id, scoped to the given owner. Throws a 404 if it
 * doesn't exist or belongs to someone else — this is the data-isolation
 * boundary referenced by test-plan.md risk #3 (never leak animal.id
 * existence across owners).
 */
export async function getOwnedAnimal(id: string, ownerId: string): Promise<Animal> {
	const [animal] = await db
		.select()
		.from(animals)
		.where(and(eq(animals.id, id), eq(animals.ownerId, ownerId)));

	if (!animal) {
		throw error(404, 'Nie znaleziono zwierzęcia.');
	}
	return animal;
}
