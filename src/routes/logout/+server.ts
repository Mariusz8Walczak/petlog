import { redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		await invalidateSession(event.locals.session.id);
	}
	deleteSessionTokenCookie(event);
	throw redirect(303, '/login');
};
