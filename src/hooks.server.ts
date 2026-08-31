import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import {
	SESSION_COOKIE_NAME,
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from '$lib/server/auth/session';

const PROTECTED_PREFIX = '/animals';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);

	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(token);
		if (session) {
			setSessionTokenCookie(event, token, session.expiresAt);
		} else {
			deleteSessionTokenCookie(event);
		}
		event.locals.user = user;
		event.locals.session = session;
	}

	if (event.url.pathname.startsWith(PROTECTED_PREFIX) && !event.locals.user) {
		const redirectTo = event.url.pathname + event.url.search;
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return resolve(event);
};
