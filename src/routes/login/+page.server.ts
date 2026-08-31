import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/animals');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Podaj e-mail i hasło.' });
		}

		const [user] = await db.select().from(users).where(eq(users.email, email));
		if (!user) {
			return fail(400, { email, error: 'Nieprawidłowy e-mail lub hasło.' });
		}

		const validPassword = await verifyPassword(user.passwordHash, password);
		if (!validPassword) {
			return fail(400, { email, error: 'Nieprawidłowy e-mail lub hasło.' });
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		const redirectTo = event.url.searchParams.get('redirectTo');
		const safeRedirect = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/animals';
		throw redirect(303, safeRedirect);
	}
};
