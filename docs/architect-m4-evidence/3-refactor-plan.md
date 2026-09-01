# Plan refaktoryzacji (M4L4)

## Problem
`getOwnedAnimal` jest jedynym mieszkańcem `src/lib/server/data-access/` — każde
inne zapytanie SQL (wagi, zdarzenia zdrowotne, join zdarzenie+leczenie dla
podpowiedzi) jest pisane bezpośrednio wewnątrz `+page.server.ts`. To rozjeżdża
się z konwencją opisaną w `CLAUDE.md` ("Workflow: adding a new domain entity"),
która zakłada, że dostęp do danych żyje w `data-access/`, a route'y tylko go
wywołują. Konkretne miejsca:

- `src/routes/animals/[id]/+page.server.ts` — dwa inline query (`weightLogs`,
  `healthEvents`) w `load`.
- `src/routes/animals/[id]/health-events/new/+page.server.ts` — inline join
  `treatments ⋈ healthEvents` zasilający `suggestTreatments`.

Konsekwencja: gdy w przyszłości ten sam join (zdarzenie+leczenie dla
zwierzęcia) będzie potrzebny gdzie indziej (np. na stronie szczegółów
zdarzenia albo w przyszłym eksporcie danych), zostanie **skopiowany**, nie
**ponownie użyty** — a schemat/warunki (np. sortowanie, `onDelete` cascade
scoping) mogą się cicho rozjechać między kopiami.

## Plan
1. **Dodaj `src/lib/server/data-access/animalRecords.ts`** z dwiema funkcjami
   wyekstrahowanymi jeden do jednego z istniejącego kodu (bez zmiany zachowania):
   - `listWeightLogs(animalId: string)`
   - `listHealthEventsWithTreatments(animalId: string)` — zwraca płaski kształt
     zgodny z `TreatmentSuggestionInput[]`, który dziś budowany jest inline w
     `health-events/new/+page.server.ts`.
2. **Podmień oba `load`** na wywołania tych funkcji; usuń zduplikowane importy
   `db`/`eq`/`and` tam, gdzie po ekstrakcji przestają być potrzebne w route file.
3. **Testy**: dopisz `animalRecords.test.ts` (integracyjny, na testowej SQLite)
   pokrywający join, który dziś nie ma żadnego testu — domyka lukę wskazaną w
   `2-feature-research.md` (punkt 4).
4. **Drobna poprawka UI (osobny, mały PR)**: w `health-events/new/+page.svelte`
   zsynchronizuj pole `symptom` formularza wyszukiwania z polem `symptom`
   formularza zapisu (jedno źródło prawdy przez `$state`), żeby użytkownik nie
   wpisywał objawu dwa razy — patrz `2-feature-research.md` (punkt 1).

## Kolejność i ryzyko
Krok 1–3 to czysty refaktor (ekstrakcja bez zmiany zachowania) — bezpieczny do
zrobienia przed krokiem 4, który dotyka UX i zasługuje na osobny commit/PR do
łatwiejszego review. Żaden krok nie zmienia `getOwnedAnimal` ani nie osłabia
scoping po `owner_id` — obie nowe funkcje przyjmują `animalId` pochodzące
wyłącznie z już zweryfikowanego `animal.id`, nigdy z surowego `params.id`.

## Czego NIE robię
Nie zamieniam substring matching w `suggestTreatments` na wyszukiwanie
semantyczne — to świadome uproszczenie MVP udokumentowane w `prd.md`, poza
zakresem tego refaktoru.
