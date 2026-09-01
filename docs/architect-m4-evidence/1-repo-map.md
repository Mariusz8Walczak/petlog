# Mapa repozytorium — PetLog (M4L2)

## Stack
SvelteKit 2 (Svelte 5 runes) + TypeScript, Drizzle ORM na SQLite (`./data/petlog.db`),
Tailwind 4, Vitest (unit), Playwright (e2e), pnpm, Docker multi-stage build,
GitHub Actions CI (lint/check/test/build/e2e), teraz też publikacja obrazu do GHCR.

## Warstwy

```
src/
├── hooks.server.ts            # jedyny punkt wejścia auth: sesja z ciasteczka,
│                               # redirect na /login dla /animals/* bez sesji
├── lib/
│   ├── server/
│   │   ├── auth/               # password.ts (argon2), session.ts (token hash w DB)
│   │   ├── db/                 # schema.ts (źródło prawdy modelu danych), index.ts (client)
│   │   ├── data-access/        # getOwnedAnimal.ts — JEDYNA granica ownership
│   │   └── domain/             # czyste funkcje bez importów DB: weightTrend,
│   │                            # treatmentSuggestion, weightInput (+ testy obok)
│   └── index.ts
└── routes/
    ├── login/, logout/
    └── animals/
        ├── +page.server.ts               # lista zwierząt właściciela
        └── [id]/
            ├── +page.server.ts            # profil: waga+trend, zdarzenia, akcje wagi
            ├── edit/
            ├── weight/[weightId]/edit/
            └── health-events/
                ├── new/+page.server.ts    # formularz + "podobne przypadki"
                └── [eventId]/
                    ├── +page.server.ts, edit/
                    └── treatments/{new,[treatmentId]/edit}/
```

## Model danych (schema.ts)
`users 1—N sessions`, `users 1—N animals 1—N weightLogs`, `animals 1—N healthEvents 1—N treatments`.
Wszystkie FK z `onDelete: 'cascade'` w stronę rodzica — usunięcie zwierzęcia kasuje
kaskadowo wagi/zdarzenia/leczenia. Każdy rekord domenowy ma `id` (`crypto.randomUUID()`)
i `createdAt` z tym samym wzorcem `$defaultFn`.

## Granica bezpieczeństwa
`getOwnedAnimal(id, ownerId)` (`src/lib/server/data-access/getOwnedAnimal.ts`) to
**jedyne** miejsce, które waliduje własność zwierzęcia (`animals.owner_id`), i jest
wywoływane na starcie każdego `load`/`action` dotykającego `[id]`. Poza tym plikiem
nie ma innej ścieżki dostępu do `animals` po surowym `id`.

## Domena vs infrastruktura
Trzy reguły biznesowe żyją jako czyste, DB-free funkcje w `domain/` z testami
jednostkowymi obok: `computeWeightTrend`, `suggestTreatments`, `isValidWeightKg`.
Zapytania SQL, które je zasilają, są jednak pisane bezpośrednio w plikach
`+page.server.ts` (nie w `data-access/`) — patrz plan refaktoryzacji (`3-refactor-plan.md`).

## Ilościowo
- 18 plików route (`+page.server.ts`/`+page.svelte`/`+server.ts`) pod `src/routes/animals`
- 3 moduły domenowe, każdy z własnym plikiem testów (`*.test.ts`)
- 1 moduł data-access (`getOwnedAnimal`)
- 1 middleware (`hooks.server.ts`)
