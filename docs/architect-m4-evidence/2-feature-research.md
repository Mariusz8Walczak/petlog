# Research ficzera: "Sprawdź podobne przypadki" (M4L3)

Wybrany ficzer: podpowiedź leczenia z historii (`suggestTreatments`,
`src/lib/server/domain/treatmentSuggestion.ts`), wpięta w formularz nowego
zdarzenia zdrowotnego (`src/routes/animals/[id]/health-events/new/`). To
oznaczony w PRD jako flagowa reguła biznesowa modułu health-events.

## Co działa dobrze
- Logika jest czysta i testowana w izolacji (`treatmentSuggestion.test.ts`) —
  łatwo zweryfikować reguły sortowania (`helped` najpierw, potem najnowsze)
  bez stawiania bazy.
- Zapytanie SQL poprawnie skopowane do jednego zwierzęcia (`WHERE
  health_events.animal_id = ?`) — brak ryzyka wycieku leczenia między
  zwierzętami różnych właścicieli, co byłoby naruszeniem granicy ownership.
- Dopasowanie działa w obie strony (`haystack.includes(needle) ||
  needle.includes(haystack)`) — dogaduje się z krótszymi i dłuższymi
  wariantami tego samego objawu ("kaszel" vs "suchy kaszel").

## Co kuleje
1. **Dwa niezsynchronizowane pola "objaw".** Formularz wyszukiwania (`method="GET"`)
   i formularz zapisu (`method="POST"`) w `+page.svelte` mają osobne pola `symptom`
   — użytkownik wpisuje objaw dwa razy, bo wpisanie go w polu wyszukiwania nie
   przenosi się do pola zapisu (i odwrotnie). Wygląda na dwa niezależne
   formularze sklejone na jednej stronie, nie na jeden spójny przepływ.
2. **Pełne przeładowanie strony na każde wyszukanie.** `method="GET"` bez
   `use:enhance` odświeża całą stronę przy każdym kliknięciu "Szukaj podobnych" —
   dla czegoś pomyślanego jako podpowiedź "w locie" to zauważalne tarcie.
3. **Dopasowanie tylko substring, bez debounce/typeahead.** Zgodnie z
   dokumentacją w kodzie to świadome uproszczenie MVP — ale przy dłuższej liście
   zdarzeń podatne na false positive (np. "ból" dopasuje "ból brzucha" i "ból ucha").
4. **Brak testu integracyjnego zapytania SQL.** Sama funkcja `suggestTreatments`
   ma unit testy, ale join `treatments ⋈ healthEvents WHERE animalId = ?` w
   `+page.server.ts` nie jest pokryty nawet testem e2e — ryzyko cichej
   regresji przy zmianie schematu.

## Wniosek
Reguła biznesowa jest solidna i dobrze odizolowana; największa luka jest na
styku UI (dwa pola zamiast jednego) i weryfikacji (brak testu na samo
zapytanie). To bezpośrednio motywuje plan refaktoryzacji w `3-refactor-plan.md`.
