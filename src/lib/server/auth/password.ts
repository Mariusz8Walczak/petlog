import { hash, verify } from '@node-rs/argon2';

// argon2id, OWASP-recommended baseline parameters.
const ARGON2_OPTS = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
} as const;

export async function hashPassword(password: string): Promise<string> {
	return hash(password, ARGON2_OPTS);
}

export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
	return verify(hashValue, password);
}
