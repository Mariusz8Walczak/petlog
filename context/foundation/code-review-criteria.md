# Code Review Criteria — PetLog

Pięć kryteriów akceptacji PR-a, ustalonych świadomie przed podłączeniem agenta do
CI/CD (10xChampion: agent w pipeline musi mieć konkretny, wymuszony kontrakt oceny,
nie rozmyty prompt "sprawdź czy kod jest dobry"). Ten plik jest źródłem prawdy — AI
reviewer w `.github/workflows/ai-review.yml` dostaje te same kryteria wprost w
system prompcie (`.github/prompts/review-system-prompt.md`).

| #   | Kryterium                                                                                                                                                                                                            | Typ          | Uzasadnienie                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Izolacja danych per użytkownik** — każde zapytanie do `animals`, `weight_logs`, `health_events`, `treatments` filtruje po `owner_id` zalogowanego użytkownika (bezpośrednio albo przez join do `animals`).         | **blocking** | To jednoosobowa appka dziś, ale bug w izolacji danych to najgorszy możliwy incydent w narzędziu przechowującym dane medyczne zwierząt — zero tolerancji. |
| 2   | **Logika domenowa oddzielona i testowalna** — nowa/zmieniona logika biznesowa (progi trendu wagi, dopasowanie leczenia) żyje w `src/lib/server/domain/**` jako czysta funkcja, z testem jednostkowym w tym samym PR. | advisory     | To serce wartości appki (patrz `prd.md`) — musi zostać testowalne, żeby nie zgnić przy pierwszej zmianie progu.                                          |
| 3   | **Walidacja danych z formularzy** — każda `action` w `+page.server.ts` waliduje input (typy, pola wymagane, sensowne zakresy — np. waga > 0) przed zapisem, nie ufa surowemu `FormData`.                             | advisory     | Dane wpisuje właściciel ręcznie, często w pośpiechu (np. przy zwierzęciu) — łatwo o literówkę, appka ma to złapać, nie zapisać.                          |
| 4   | **Migracje Drizzle spójne ze schematem** — zmiana w `schema.ts` ma odpowiadający plik migracji wygenerowany `drizzle-kit generate` w tym samym PR.                                                                   | advisory     | Rozjazd schema/migracja to klasyczny sposób na zepsucie bazy przy pierwszym deployu.                                                                     |
| 5   | **Brak sekretów w kodzie, hasła zawsze hashowane** — brak haseł/tokenów/zawartości `.env` w diffie, hasła nigdy plaintext, logi błędów nie zrzucają surowego payloadu z hasłem/tokenem.                              | **blocking** | Nieodwracalne, jeśli wycieknie do publicznego repo — stąd blocking, nie advisory.                                                                        |

**Werdykt:** `changes_requested` wtedy i tylko wtedy, gdy którekolwiek kryterium
oznaczone jako _blocking_ nie przechodzi. Kryteria _advisory_ trafiają do komentarza
na PR jako sygnał, ale nie blokują mergea — to świadoma decyzja, żeby agent w CI
faktycznie coś zatrzymywał (bo ma na czym), a nie tylko generował szum.
