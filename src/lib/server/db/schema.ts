import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// --- users & sessions (custom session-based auth, "Lucia pattern") ---

export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const sessions = sqliteTable('sessions', {
	// id is the SHA-256 hash of the raw session token stored in the cookie —
	// only the hash ever touches the database.
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	animals: many(animals)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

// --- domain: animals ---

export const SPECIES = ['cat', 'dog', 'rabbit', 'other'] as const;
export type Species = (typeof SPECIES)[number];

export const animals = sqliteTable('animals', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	ownerId: text('owner_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	species: text('species', { enum: SPECIES }).notNull(),
	breed: text('breed'),
	// ISO date string (YYYY-MM-DD), optional
	birthDate: text('birth_date'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

// --- domain: weight logs ---

export const weightLogs = sqliteTable('weight_logs', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	animalId: text('animal_id')
		.notNull()
		.references(() => animals.id, { onDelete: 'cascade' }),
	weightKg: real('weight_kg').notNull(),
	// ISO date string (YYYY-MM-DD) — when the weight was measured
	measuredAt: text('measured_at').notNull(),
	note: text('note'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

// --- domain: health events ---

export const HEALTH_EVENT_STATUS = ['ongoing', 'resolved'] as const;
export type HealthEventStatus = (typeof HEALTH_EVENT_STATUS)[number];

export const healthEvents = sqliteTable('health_events', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	animalId: text('animal_id')
		.notNull()
		.references(() => animals.id, { onDelete: 'cascade' }),
	// ISO date string (YYYY-MM-DD)
	occurredAt: text('occurred_at').notNull(),
	symptom: text('symptom').notNull(),
	diagnosis: text('diagnosis'),
	status: text('status', { enum: HEALTH_EVENT_STATUS }).notNull().default('ongoing'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

// --- domain: treatments ---

export const TREATMENT_OUTCOME = ['helped', 'no_effect', 'worsened', 'unknown'] as const;
export type TreatmentOutcome = (typeof TREATMENT_OUTCOME)[number];

export const treatments = sqliteTable('treatments', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	healthEventId: text('health_event_id')
		.notNull()
		.references(() => healthEvents.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	dosage: text('dosage'),
	// ISO date strings (YYYY-MM-DD)
	startDate: text('start_date').notNull(),
	endDate: text('end_date'),
	outcome: text('outcome', { enum: TREATMENT_OUTCOME }).notNull().default('unknown'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

// --- relations ---

export const animalsRelations = relations(animals, ({ one, many }) => ({
	owner: one(users, { fields: [animals.ownerId], references: [users.id] }),
	weightLogs: many(weightLogs),
	healthEvents: many(healthEvents)
}));

export const weightLogsRelations = relations(weightLogs, ({ one }) => ({
	animal: one(animals, { fields: [weightLogs.animalId], references: [animals.id] })
}));

export const healthEventsRelations = relations(healthEvents, ({ one, many }) => ({
	animal: one(animals, { fields: [healthEvents.animalId], references: [animals.id] }),
	treatments: many(treatments)
}));

export const treatmentsRelations = relations(treatments, ({ one }) => ({
	healthEvent: one(healthEvents, {
		fields: [treatments.healthEventId],
		references: [healthEvents.id]
	})
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Animal = typeof animals.$inferSelect;
export type NewAnimal = typeof animals.$inferInsert;
export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;
export type HealthEvent = typeof healthEvents.$inferSelect;
export type NewHealthEvent = typeof healthEvents.$inferInsert;
export type Treatment = typeof treatments.$inferSelect;
export type NewTreatment = typeof treatments.$inferInsert;
