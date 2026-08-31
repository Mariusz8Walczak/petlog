# PRD — PetLog

## Problem

W domu jest kilka zwierząt różnych gatunków (koty, psy, króliki), każde ze swoją
historią zdrowia. Dziś ta historia żyje w pamięci, luźnych notatkach i paragonach
z weterynarza. Efekt: nie da się szybko odpowiedzieć na proste pytania:

- Ile ważył konkretny kot 6 miesięcy temu? Czy to więcej, czy mniej niż teraz?
- Co dostał ostatnim razem, gdy miał podobny objaw — i czy to zadziałało?
- Czy obecny spadek/wzrost wagi to coś, na co trzeba zareagować, czy normalna wariancja?

Brak centralnego miejsca na te dane oznacza, że decyzje (np. "czy jechać do weta")
podejmowane są bez dostępu do własnej historii, którą przecież się ma — tylko
rozproszonej.

## Użytkownicy

Jedno gospodarstwo domowe, jeden zalogowany właściciel (MVP: single-user).
Wielu zwierząt na jedno konto.

## Cel / kryterium sukcesu

Właściciel w mniej niż 10 sekund:

1. widzi historię wagi dowolnego zwierzęcia i wie, czy aktualny trend jest niepokojący,
2. widzi, jakie leczenie było stosowane przy poprzednim podobnym objawie i czy pomogło.

## Zakres MVP

### Zwierzęta (`animals`)

CRUD: dodaj / lista / edytuj / usuń. Pola: imię, gatunek (kot/pies/królik/inne),
rasa (opcjonalnie), data urodzenia (opcjonalnie).

### Wpisy wagi (`weight_logs`)

CRUD: dodaj / lista (chronologicznie) / edytuj / usuń. Pola: data pomiaru, waga (kg),
notatka (opcjonalnie).

**Reguła biznesowa — detekcja trendu wagi.** Dla każdego zwierzęcia licz zmianę
procentową wagi w oknie 30 dni (ostatni wpis vs. najbliższy wpis sprzed ~30 dni).
Statusy:

- `stable` — zmiana w granicach ±5%
- `watch` — zmiana 5–10%
- `alert` — zmiana >10% (w dowolną stronę)

Status pokazywany jako odznaka na stronie zwierzęcia, obok listy/wykresu wagi.

_Znane uproszczenie MVP:_ jeden globalny próg dla wszystkich gatunków (próg per-gatunek
— np. inny dla królika, inny dla psa — to rozszerzenie z roadmapy).

### Zdarzenia zdrowotne (`health_events`)

CRUD: dodaj / lista / edytuj / usuń. Pola: data, objaw/opis, status (`w trakcie` /
`zakończone`), notatki.

### Leczenie (`treatments`)

CRUD, powiązane ze zdarzeniem zdrowotnym. Pola: nazwa leku/zabiegu, dawka, data
rozpoczęcia, data zakończenia (opcjonalnie), **skutek** (`pomogło` / `bez efektu` /
`pogorszenie` / `nie wiadomo`), notatki.

**Reguła biznesowa — podpowiedź z historii leczenia.** Przy dodawaniu nowego
zdarzenia zdrowotnego system przeszukuje wcześniejsze `health_events` **tego samego
zwierzęcia**, dopasowując po słowach kluczowych w polu objawu (case-insensitive
substring match), i pokazuje listę wcześniej stosowanych leczeń dla podobnych
objawów, posortowaną: `pomogło` najpierw, potem wg daty (najnowsze pierwsze).

_Znane uproszczenie MVP:_ dopasowanie tylko w obrębie tego samego zwierzęcia
(dopasowanie międzygatunkowe/między zwierzętami — roadmapa), prosty match tekstowy
zamiast pełnego wyszukiwania semantycznego.

### Auth

Logowanie (e-mail + hasło), sesja w ciasteczku, dane (`animals` i wszystko powiązane)
filtrowane po `owner_id` zalogowanego użytkownika. Brak rejestracji publicznej w UI —
konto zakłada się raz, ręcznie (skrypt/seed), bo to narzędzie na własny użytek jednego
gospodarstwa domowego, nie SaaS.

## Poza zakresem MVP (patrz roadmap.md)

Przypomnienia o szczepieniach/dawkach, współdzielenie zwierząt między wieloma kontami,
załączniki/zdjęcia dokumentacji medycznej, sugestie leczenia wspierane AI, eksport
PDF dla weterynarza, kalendarz wizyt, progi wagi per gatunek.

## Wymagania niefunkcjonalne

- Działa lokalnie przez Docker (docker-compose), dane w pliku SQLite na zamontowanym
  wolumenie — brak zależności od usług zewnętrznych.
- Jedna instancja, jeden użytkownik na start — bez wymogu wysokiej dostępności.
