# Code Review Criteria — PetLog

Pięć kryteriów akceptacji PR-a, ustalonych świadomie przed podłączeniem agenta do
CI/CD (10xChampion: agent w pipeline musi mieć konkretny kontrakt oceny, nie
rozmyty prompt "sprawdź czy kod jest dobry"). Człowiek (i reviewer, ludzki albo AI)
oceniają PR-a względem tej listy — to jest źródło prawdy dla obu.

## Jak to jest wpięte w pipeline (i dlaczego zmieniło się w trakcie budowy)

Pierwsza wersja tego pipeline'u wołała `actions/ai-inference` przez **GitHub
Models** (darmowe, bez klucza API) z tymi kryteriami wstrzykniętymi jako system
prompt i wymuszonym JSON-em na wyjściu. W trakcie wdrażania okazało się, że
**GitHub Models zostało całkowicie wycofane 30 lipca 2026** — usługa nie istnieje,
`actions/ai-inference@v1` zwraca `410 ... scheduled retirement brownout`. Zamiast
przepinać się na klucz API (Anthropic/OpenRouter) albo na Copilot CLI (wymaga
licencji), okazało się, że **natywny GitHub Copilot PR reviewer** już działa na
tym repo automatycznie na każdym PR — za darmo, bez dodatkowej konfiguracji — i
faktycznie recenzuje kod względem tych samych zasad inżynierskich (patrz PR #1:
Copilot znalazł realną niespójność między komunikatem walidacji a rzeczywistą
regułą). To jest teraz "agent w pipeline" dla 10xChampion: `ci.yml` pilnuje
lint/typecheck/testów/builda mechanicznie, a Copilot PR reviewer daje
merytoryczny, tekstowy review na każdym PR — dokładnie kategorie dowodu z lekcji
(pipeline z jobem, logi, komentarz LLM na PR).

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
