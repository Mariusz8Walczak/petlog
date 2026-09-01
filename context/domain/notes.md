# Notatki domenowe (M4L5, inspirowane DDD)

## Bounded context
Jeden bounded context: **opieka nad zwierzęciem domowym w jednym gospodarstwie
domowym** (zgodnie z `prd.md` — "single-household, multi-pet"). Nie ma
współdzielenia zwierzęcia między kontami ani koncepcji kliniki/lekarza jako
osobnego aktora — to świadomie poza granicą kontekstu na etapie MVP.

## Agregaty i ich korzenie (aggregate roots)
- **Animal** — korzeń agregatu. Wszystko poniżej (`WeightLog`, `HealthEvent`,
  `Treatment`) istnieje wyłącznie w relacji do jednego `Animal` i jest
  kasowane kaskadowo wraz z nim (`onDelete: 'cascade'` w `schema.ts`).
- **HealthEvent** jest lokalnym korzeniem dla `Treatment` (leczenie nie
  istnieje bez zdarzenia zdrowotnego, które je wywołało) — ale oba żyją
  wewnątrz agregatu `Animal`, nie są osobnymi bounded contexts.
- **User** to osobny, płytki agregat (auth) — jego jedynym związkiem z
  domeną zwierząt jest `ownerId` jako klucz obcy, nigdy odwrotnie.

## Encje vs value objects
- Encje z tożsamością (`id: crypto.randomUUID()`): `Animal`, `WeightLog`,
  `HealthEvent`, `Treatment`.
- Value objects bez własnej tożsamości, przenoszone jako dane w encjach:
  `Species` (enum), `HealthEventStatus`, `TreatmentOutcome` — wszystkie
  reprezentowane jako `text(..., { enum: [...] })`, nie osobne tabele
  słownikowe. Świadomy wybór: te zbiory wartości są małe i stabilne, osobna
  tabela byłaby overengineeringiem na tym etapie.

## Reguły biznesowe jako domain services
`weightTrend.ts` i `treatmentSuggestion.ts` to bezstanowe domain services —
nie metody na encjach, bo operują na *historii* (kolekcji encji), nie na
pojedynczym rekordzie. Świadomie odseparowane od Drizzle: przyjmują proste
typy (`WeightPoint[]`, `TreatmentSuggestionInput[]`), nie `typeof
weightLogs.$inferSelect` wprost — dzięki temu są testowalne bez bazy i nie
łamią się przy zmianach kolumn niezwiązanych z logiką (np. dodanie nowej
kolumny do `weightLogs` nie wymusza zmiany w `weightTrend.ts`).

## Ownership jako reguła domenowa, nie tylko techniczna
`owner_id` na `Animal` nie jest tylko FK — to granica kontekstu w sensie DDD:
każde zapytanie, które przekracza tę granicę bez sprawdzenia `ownerId`, jest
błędem domenowym (wyciek istnienia cudzego zwierzęcia), nie tylko błędem
bezpieczeństwa. Dlatego `getOwnedAnimal` jest jedynym legalnym sposobem
wejścia do agregatu `Animal` z warstwy routingu.

## Co świadomie zostawiamy poza modelem (MVP scope)
- Brak agregatu "Klinika"/"Lekarz" — `Treatment.name`/`dosage` to zwykły
  tekst, nie referencja do słownika leków.
- Brak współdzielenia `Animal` między wieloma `User` (np. rodzina) — jeden
  właściciel na zwierzę, zgodnie z `prd.md`.
- `suggestTreatments` dopasowuje tylko w obrębie jednego `Animal` — nie ma
  pojęcia populacji/rasy jako kontekstu podpowiedzi między zwierzętami.
