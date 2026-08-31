# Roadmap — PetLog

## Milestone 0 — Bootstrap

- Scaffold SvelteKit + TypeScript + Tailwind (`pnpm create svelte`).
- Drizzle + SQLite: schema, migracje, connection.
- `docker-compose.yml` + `Dockerfile` (adapter-node), wolumen na plik SQLite.
- **Gate:** `pnpm run build` i `docker compose up` działają na pustym projekcie.

## Milestone 1 — Auth

- Tabele `users`, `sessions`.
- Hashowanie hasła (argon2), sesja w httpOnly cookie, `hooks.server.ts` walidujący sesję.
- Strona logowania + wylogowanie, ochrona tras `/animals/**`.
- Skrypt seed do utworzenia pierwszego konta (bez publicznej rejestracji).
- **Gate:** niezalogowany użytkownik jest przekierowany z `/animals` na `/login`.

## Milestone 2 — Zwierzęta (CRUD)

- Tabela `animals`, formularze dodaj/edytuj/usuń, lista scoped po `owner_id`.
- **Gate:** pełny CRUD działa end-to-end na danych trwałych.

## Milestone 3 — Waga + logika trendu

- Tabela `weight_logs`, CRUD, lista chronologiczna.
- `computeWeightTrend()` w `lib/server/domain/weightTrend.ts` (czysta funkcja, bez zależności od DB — łatwa do testowania jednostkowego).
- Odznaka trendu (`stable`/`watch`/`alert`) na stronie zwierzęcia.
- **Gate:** test jednostkowy dla progu 10%/5% przechodzi.

## Milestone 4 — Zdarzenia zdrowotne + leczenie

- Tabele `health_events`, `treatments`, CRUD dla obu, powiązanie 1:N.
- Pole `outcome` na leczeniu.
- **Gate:** można zalogować objaw i przypisane leczenie ze skutkiem.

## Milestone 5 — Podpowiedź leczenia

- `suggestTreatments()` w `lib/server/domain/treatmentSuggestion.ts`.
- Integracja w formularzu dodawania zdarzenia zdrowotnego — panel "podobne przypadki wcześniej".
- **Gate:** test jednostkowy dopasowania i sortowania przechodzi.

## Milestone 6 — Testy i dokumentacja

- Playwright e2e: `weight-trend-alert.spec.ts` (ryzyko #1 z test-plan.md).
- README.md z opisem projektu i instrukcją uruchomienia.
- **Gate:** wszystkie testy z test-plan.md (min. ryzyko #1) przechodzą w CI lub lokalnie.

## Milestone 7 — Docker packaging

- Finalny `Dockerfile` multi-stage (build + runtime), `docker-compose.yml` z wolumenem danych.
- Weryfikacja: świeży `docker compose up --build` od zera → aplikacja działa, dane przetrwają restart.

---

## Poza MVP (10xArchitect / przyszłość)

- Progi wagi per gatunek (inny próg dla królika niż dla psa).
- Współdzielenie zwierząt między kontami (wspólne gospodarstwo domowe, wielu opiekunów).
- Przypomnienia o szczepieniach i cyklicznych dawkach (harmonogram + powiadomienia).
- Załączniki — zdjęcia, skany wyników badań przy `health_events`.
- Podpowiedź leczenia międzygatunkowa / między zwierzętami, ewentualnie wspomagana AI
  (np. przez OpenRouter) zamiast prostego dopasowania słów kluczowych.
- Eksport historii do PDF na wizytę u weterynarza.
- CI/CD pipeline (GitHub Actions: lint + test + build kontenera) — 10xChampion.
