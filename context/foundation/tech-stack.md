# Tech Stack — PetLog

## Warstwa aplikacji
- **SvelteKit** (adapter-node) — full-stack: routing, server load functions,
  form actions jako backend bez osobnego API layera.
- **TypeScript** wszędzie.
- **pnpm** jako package manager.

## Dane
- **SQLite** — plik na wolumenie Dockera, brak zewnętrznego serwera DB (pasuje do
  jednego gospodarstwa domowego / jednej instancji).
- **Drizzle ORM** + `drizzle-kit` do migracji i schematu.
- Tabele MVP: `users`, `sessions`, `animals`, `weight_logs`, `health_events`,
  `treatments`.

## Auth
- Własna implementacja session-based (wzorzec Lucia "Learn" — biblioteka Lucia jest
  zarchiwizowana, ale wzorzec pozostaje aktualnym standardem: sesje po stronie
  serwera, nie JWT w cookie).
- Hashowanie haseł: `@node-rs/argon2`.
- Sesja: losowy token w httpOnly cookie, rekord w tabeli `sessions` (SQLite),
  walidacja w `hooks.server.ts`.

## UI
- **Tailwind CSS** — tylko dla szybkości pisania formularzy/tabel. Styling nie jest
  oceniany w projekcie zaliczeniowym, więc minimalizm > estetyka.
- Wykres wagi: proste inline SVG (sparkline) renderowane server-side z danych —
  bez dodatkowej biblioteki wykresów. Wymagany deliverable to lista wpisów + odznaka
  trendu (`stable`/`watch`/`alert`); wykres to nice-to-have.

## Testy
- **Vitest** — testy jednostkowe logiki domenowej: `computeWeightTrend()`,
  `suggestTreatments()`.
- **Playwright** — jeden test e2e z perspektywy użytkownika, powiązany z
  ryzykiem #1 z `test-plan.md` (patrz test-plan.md).

## Deployment
- **Docker + docker-compose**, jeden kontener (SvelteKit `adapter-node`, `node build`
  na porcie np. 3000).
- SQLite plik montowany jako wolumen (`./data:/app/data`), żeby dane przetrwały
  restart kontenera.
- Bez publicznego URL — zgodnie z wymogi.md, projekt niewebowy/self-hosted nie
  wymaga publicznego adresu; zamiast tego dokumentacja + zrzuty ekranu pokazujące
  strukturę projektu i działanie w kontenerze.

## Struktura katalogów (docelowa)
```
src/
  lib/
    server/
      db/           # schema.ts (drizzle), migrations, seed
      auth/          # session.ts, password.ts
      domain/        # weightTrend.ts, treatmentSuggestion.ts (czysta logika, testowalna)
  routes/
    (auth)/login/
    animals/
    animals/[id]/
    animals/[id]/weight/
    animals/[id]/health-events/
context/foundation/  # prd.md, tech-stack.md, roadmap.md, test-plan.md
docker-compose.yml
Dockerfile
```
