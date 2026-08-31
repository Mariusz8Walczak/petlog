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
- **Klient SQLite: `@libsql/client`** (nie `better-sqlite3`) — decyzja z
  "your call" powyżej. Wybrany, bo dystrybuuje gotowe (prebuilt) binarki dla
  Linuksa przez npm optional-dependencies bez potrzeby toolchainu do
  kompilacji natywnych modułów (`python`/`make`/`g++`) w obrazie Dockera, co
  upraszcza multi-stage build. `drizzle-kit` (dev-only, CLI) używa go do
  `generate`/`migrate` lokalnie; w kontenerze w runtime migracje odpalane są
  bez `drizzle-kit` — patrz "Uruchamianie w Dockerze" niżej.
- **Uwaga implementacyjna:** `@libsql/client` i `drizzle-orm` musiały trafić do
  `dependencies`, nie `devDependencies` (tak wygenerował je `sv create` z
  add-onem drizzle) — kod aplikacji (`src/lib/server/db/index.ts`) importuje
  je w runtime, więc `pnpm install --prod` w slim runtime stage Dockera by je
  pominął. Poprawione w commicie `build: Docker packaging`.

## Auth

- Własna implementacja session-based (wzorzec Lucia "Learn" — biblioteka Lucia jest
  zarchiwizowana, ale wzorzec pozostaje aktualnym standardem: sesje po stronie
  serwera, nie JWT w cookie).
- Hashowanie haseł: `@node-rs/argon2` — zainstalował się i zbudował bez
  problemów zarówno na Windows (lokalnie), jak i w obrazie Dockera
  (`node:22-slim`), więc **fallback na `node:crypto` scrypt nie był
  potrzebny**, wbrew założeniu "if that causes problems" z briefu.
- Sesja: losowy token (32 bajty, `node:crypto.randomBytes`, base64url) w
  httpOnly cookie; w tabeli `sessions` przechowywany jest tylko SHA-256 hash
  tokenu (nie sam token) — wyciek bazy sam w sobie nie pozwala podszyć się
  pod sesję. Walidacja + sliding expiration (odświeżanie po przekroczeniu
  połowy 30-dniowego czasu życia) w `hooks.server.ts`.

## Uruchamianie w Dockerze — migracje w runtime

`drizzle-kit` to `devDependency` (celowo pominięty w slim runtime stage), więc
migracje w kontenerze **nie** korzystają z `drizzle-kit migrate`. Zamiast tego
`docker-entrypoint.sh` przy każdym starcie kontenera odpala
`scripts/docker-migrate.mjs`, który używa wbudowanego migratora z
`drizzle-orm/libsql/migrator` (czysty `drizzle-orm` + `@libsql/client`,
oba już i tak w `dependencies`) i czyta pliki SQL z `drizzle/`. Analogicznie
`scripts/docker-seed.mjs` to odpowiednik `pnpm run seed` bez zależności od
`tsx`/`dotenv` (dev-only) — uruchamiany ręcznie:
`docker compose exec app node scripts/docker-seed.mjs`.

## UI

- **Tailwind CSS** — tylko dla szybkości pisania formularzy/tabel. Styling nie jest
  oceniany w projekcie zaliczeniowym, więc minimalizm > estetyka.
- Wykres wagi: proste inline SVG (sparkline) renderowane server-side z danych —
  bez dodatkowej biblioteki wykresów. Wymagany deliverable to lista wpisów + odznaka
  trendu (`stable`/`watch`/`alert`); wykres to nice-to-have.

## Testy

- **Vitest** — testy jednostkowe logiki domenowej: `computeWeightTrend()`,
  `suggestTreatments()`. Pliki `*.test.ts` obok logiki, w
  `src/lib/server/domain/`.
- **Playwright** — jeden test e2e z perspektywy użytkownika
  (`e2e/weight-trend-alert.spec.ts`), powiązany z ryzykiem #1 z
  `test-plan.md` (patrz test-plan.md). Katalog `e2e/` jest celowo **poza**
  `src/` — Vitest skanuje tylko `src/**/*.{test,spec}.ts`, więc trzymanie
  speców Playwrighta osobno pozwala obu na nazewnictwo `*.spec.ts` bez
  kolizji (scaffold domyślnie rozwiązywał to konwencją `*.e2e.ts`, tu
  zamiast tego rozdzielono katalogi, żeby zachować dokładną nazwę pliku z
  briefu).

## Deployment

- **Docker + docker-compose**, jeden kontener (SvelteKit `adapter-node`, `node build`
  na porcie np. 3000).
- SQLite plik montowany jako wolumen (`./data:/app/data`), żeby dane przetrwały
  restart kontenera.
- Bez publicznego URL — zgodnie z wymogi.md, projekt niewebowy/self-hosted nie
  wymaga publicznego adresu; zamiast tego dokumentacja + zrzuty ekranu pokazujące
  strukturę projektu i działanie w kontenerze.

## Struktura katalogów (faktyczna)

```
src/
  lib/
    server/
      db/            # schema.ts (drizzle), index.ts (client + connection)
      auth/          # session.ts, password.ts
      domain/        # weightTrend.ts, treatmentSuggestion.ts (+ *.test.ts) — czysta logika
      data-access/    # getOwnedAnimal.ts (owner_id scoping helper)
  routes/
    login/, logout/
    animals/                                  # lista + dodaj/usuń
    animals/[id]/                             # szczegóły: waga + trend + zdarzenia
    animals/[id]/edit/
    animals/[id]/weight/[weightId]/edit/
    animals/[id]/health-events/new/           # + panel "podobne przypadki"
    animals/[id]/health-events/[eventId]/
    animals/[id]/health-events/[eventId]/edit/
    animals/[id]/health-events/[eventId]/treatments/new/
    animals/[id]/health-events/[eventId]/treatments/[treatmentId]/edit/
scripts/
  seed-user.ts        # pnpm run seed (lokalnie, przez tsx)
  docker-migrate.mjs   # migracje w runtime kontenera (drizzle-orm migrator)
  docker-seed.mjs      # odpowiednik seed-user.ts dla kontenera (bez tsx/dotenv)
e2e/
  weight-trend-alert.spec.ts
drizzle/               # wygenerowane migracje SQL (drizzle-kit generate)
context/foundation/    # prd.md, tech-stack.md, roadmap.md, test-plan.md
docker-compose.yml
Dockerfile
```

Uwaga: katalog nazwany dosłownie `data` w `src/lib/server/` kolidowałby z regułą
`.gitignore` (`data/` — wolumen SQLite), więc nazwano go `data-access/`.
