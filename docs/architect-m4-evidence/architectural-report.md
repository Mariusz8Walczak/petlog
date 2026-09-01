# Raport architektoniczny — PetLog (M4)

*Two-pager syntezujący cztery artefakty modułu 4: [`1-repo-map.md`](./1-repo-map.md),
[`2-feature-research.md`](./2-feature-research.md), [`3-refactor-plan.md`](./3-refactor-plan.md),
[`context/domain/notes.md`](../../context/domain/notes.md).*

## 1. Gdzie jesteśmy (mapa repo)
PetLog to SvelteKit + Drizzle/SQLite tracker zdrowia zwierząt, jeden bounded
context: "opieka nad zwierzęciem w jednym gospodarstwie domowym". Warstwy są
rozdzielone czytelnie: `routes/` (HTTP), `lib/server/domain/` (czyste reguły
biznesowe, testowane w izolacji), `lib/server/data-access/` (dostęp do danych
z egzekwowaniem `owner_id`), `lib/server/db/schema.ts` (jedno źródło prawdy
modelu). Cała hierarchia danych wisi na jednym agregacie — `Animal` —
kaskadowo kasowanym wraz z zależnymi `WeightLog`/`HealthEvent`/`Treatment`.

Silna strona architektury: **granica ownership jest w jednym miejscu**
(`getOwnedAnimal`), nie rozproszona po route'ach. To zmniejsza ryzyko klasy
błędów "zapomniałem dodać `WHERE owner_id = ?`" niemal do zera, bo nie ma
alternatywnej ścieżki wejścia do agregatu `Animal`.

## 2. Gdzie architektura jest niespójna (research ficzera)
Zbadałem flagową regułę biznesową — podpowiedź leczenia z historii
(`suggestTreatments`) wpiętą w formularz nowego zdarzenia zdrowotnego. Sama
logika domenowa jest solidna: czysta, testowana jednostkowo, poprawnie
skopowana do jednego zwierzęcia. Problem leży na dwóch stykach:

- **UI**: dwa niezsynchronizowane pola "objaw" (formularz wyszukiwania GET +
  formularz zapisu POST) zmuszają użytkownika do wpisania tego samego objawu
  dwa razy — ficzer pomyślany jako "podpowiedź w locie" wygląda jak dwa
  sklejone, niezależne formularze.
- **Warstwa danych**: zapytanie SQL zasilające podpowiedź (join
  `treatments ⋈ healthEvents`) jest pisane inline w `+page.server.ts`, nie w
  `data-access/` — i nie ma żadnego testu na sam join, tylko na czystą
  funkcję domenową, którą zasila.

## 3. Co z tym robimy (plan refaktoryzacji)
Ekstrahuję dwa inline zapytania (`weightLogs`, join zdarzenie+leczenie) do
nowego `data-access/animalRecords.ts`, zgodnie z konwencją już ustaloną przez
`getOwnedAnimal.ts` i opisaną w `CLAUDE.md`. To czysty refaktor — zero zmiany
zachowania — plus jeden test integracyjny domykający lukę w pokryciu joina.
Synchronizacja pól "objaw" w UI to świadomie **osobny, mały PR** — dotyka UX,
nie architektury danych, i nie powinna być zmieszana z ekstrakcją data-access
w jednym review.

Celowo **nie** ruszam substring matching w `suggestTreatments` — to
udokumentowane w `prd.md` uproszczenie MVP, poza zakresem tego refaktoru.
Refaktor nie dotyka `getOwnedAnimal` ani nie zmienia sposobu scoping po
`owner_id` — obie nowe funkcje data-access przyjmują `animalId` pochodzące
wyłącznie z już zweryfikowanego `animal.id`.

## 4. Jak o tym myślę w kategoriach domenowych
`Animal` to jedyny agregat root; `HealthEvent`/`Treatment`/`WeightLog` nie
mają samodzielnego bytu poza nim. `weightTrend`/`treatmentSuggestion` to
domain services (bezstanowe, operują na kolekcjach, nie na pojedynczej
encji) — świadomie odseparowane od typów Drizzle, żeby zmiana kolumny w
schemacie nie wymuszała zmiany w logice biznesowej. Ownership (`owner_id`)
traktuję nie jako szczegół techniczny, tylko jako granicę kontekstu w sensie
DDD: jej naruszenie to błąd domenowy (wyciek istnienia cudzego zwierzęcia),
nie tylko błąd bezpieczeństwa — stąd upieranie się przy jednym legalnym
punkcie wejścia do agregatu.

## Jedno zdanie podsumowania
Architektura jest spójna tam, gdzie dotyczy bezpieczeństwa (ownership) i
logiki domenowej (czyste funkcje), a niespójna tam, gdzie dostęp do danych
wycieka z `data-access/` z powrotem do warstwy routingu — i to jest
świadomie ograniczony, jednokierunkowy refaktor, a nie przepisywanie od zera.
