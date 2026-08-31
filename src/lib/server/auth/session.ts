/**
 * Custom session-based auth — the SvelteKit ecosystem's standard "Lucia pattern"
 * (the Lucia library itself is archived, but this token/hash/cookie approach
 * remains the recommended way to roll your own session auth with SvelteKit).
 *
 * - A random 32-byte token is generated and sent to the browser in an httpOnly
 *   cookie. Only its SHA-256 hash is stored in the `sessions` table, so a
 *   database leak alone can't be used to forge sessions.
 * - Sessions last 30 days and are renewed (sliding expiration) once they're
 *   past the halfway point of their lifetime.
 */

import { randomBytes, createHash } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '../db';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Session, User } from '../db/schema';

export const SESSION_COOKIE_NAME = 'petlog_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const RENEW_THRESHOLD_MS = SESSION_DURATION_MS / 2;

export function generateSessionToken(): string {
	return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createSession(token: string, userId: string): Promise<Session> {
	const session: Session = {
		id: hashToken(token),
		userId,
		expiresAt: new Date(Date.now() + SESSION_DURATION_MS)
	};
	await db.insert(sessions).values(session);
	return session;
}

export type SessionValidationResult =
	{ session: Session; user: User } | { session: null; user: null };

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = hashToken(token);
	const result = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (result.length === 0) {
		return { session: null, user: null };
	}
	const { session, user } = result[0];

	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - RENEW_THRESHOLD_MS) {
		session.expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id));
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: !DEV_MODE(event),
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: !DEV_MODE(event),
		maxAge: 0,
		path: '/'
	});
}

// Only require `secure` cookies when not running over plain HTTP dev/docker-local.
function DEV_MODE(event: RequestEvent): boolean {
	return event.url.protocol === 'http:';
}
