# Test Plan — PetLog

## Ryzyko 1 (główne, pokryte testem — wymagane minimum)

**Opis:** Właściciel nie zauważy niebezpiecznego trendu wagi zwierzęcia (nagły
spadek lub wzrost), bo dane trzeba by porównywać ręcznie, wpis po wpisie, i
łatwo to pominąć w codziennym pośpiechu.

**Pokrycie:**
- Test jednostkowy (Vitest) — `computeWeightTrend()`:
  - spadek >10% w oknie 30 dni → `alert`
  - zmiana w granicach ±5% → `stable`
  - zmiana 5–10% → `watch`
- Test e2e (Playwright), z perspektywy użytkownika — `weight-trend-alert.spec.ts`:
  zalogowany użytkownik dodaje zwierzę, dodaje dwa wpisy wagi (30 dni odstępu,
  spadek 15%), otwiera stronę zwierzęcia i widzi odznakę `alert` przy wykresie wagi.

## Ryzyko 2 (drugorzędne, stretch)

**Opis:** Podpowiedź leczenia pokazuje leczenie niepowiązane z aktualnym objawem
(np. z innego zwierzęcia albo zupełnie inny problem), co może skierować właściciela
na błędny trop zamiast pomóc.

**Pokrycie:**
- Test jednostkowy — `suggestTreatments()`: zwraca tylko wpisy tego samego
  zwierzęcia, dopasowane po słowie kluczowym objawu, z `pomogło` na pierwszym
  miejscu listy.

## Ryzyko 3 (drugorzędne, stretch)

**Opis:** Naruszenie izolacji danych — dane jednego konta widoczne dla innego
(istotne, gdy w przyszłości pojawi się więcej niż jedno konto, patrz roadmap.md).

**Pokrycie:**
- Test integracyjny: zapytanie o `animals` filtruje po `owner_id` sesji; próba
  pobrania zwierzęcia innego właściciela zwraca 404/pustą odpowiedź.

## Poza zakresem testów MVP

Testy wydajnościowe, testy na dużym wolumenie danych, testy UI/wizualne (regresja
snapshotów) — nieistotne przy jednym użytkowniku i lokalnym wdrożeniu.
