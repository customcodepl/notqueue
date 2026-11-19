# F-DESIGN-MOCKUPS: user test script

A short test of the hi-fi design with people from the product owner's network, before the mockups are approved ([plan](plan.md), decision 5). The product owner runs it; this page is the script, the task cards and the notes sheet.

## What is tested
- **Customer prototype** (phone): join → enable alerts → status → called → "I'm coming". [notqueue prototype customer](https://claude.ai/artifact/LQLG2kLsWJ63oCD5jkUUqY)
- **Staff prototype** (tablet, portrait): the queue, call, undo, served, no-show, call again, add a walk-in, QR handoff. [notqueue prototype staff](https://claude.ai/artifact/Wp8sevhVtVvWfvwq6YeJBQ)

Both are private: share each from its Share menu before the session, then open the link on the device.

**What the prototypes fake** (tell nobody in advance; explain after):
- The customer's place in the queue drops by one every 8 seconds, and they are called after about 24 seconds.
- Sound plays only if the participant tapped "Włącz powiadomienia"; vibration works on Android only; a locked phone gets nothing, as in the real product.
- On the staff side, a called customer with alerts on confirms "I'm coming" after 6 seconds.
- The QR code on the handoff screen is a placeholder and does not scan.

## Participants and setup
- 2–3 people as **staff** (on a tablet) and 2–3 as **customers** (on their own phone). One person per session, about 20 minutes.
- Staff sessions: the participant stands, the tablet lies on a table or counter at arm's length, as at a host stand.
- Customer sessions: the participant uses their own phone, sound on, in a normal browser.
- **No recordings, no names in the notes.** Participants are P1, P2, …; write down age band and how often they use queues or waitlists only if they want to tell you.
- Limitation, recorded in the plan: they are not real venue staff or customers, so findings about real rush hours and routines are weaker.

## How to run a session
1. Say (PL): "Testujemy projekt, nie Ciebie. Nie ma złych odpowiedzi. Mów na głos, co myślisz i czego szukasz. Jeśli utkniesz, to wina projektu."
2. Read each task card aloud, then stay quiet. Do not point at the screen. If they are stuck for about 30 seconds, ask "Czego szukasz?" and note it as a hesitation.
3. After each task, ask: "Jak łatwe to było, od 1 (bardzo trudne) do 7 (bardzo łatwe)?"
4. At the end, ask the closing questions, then explain what was faked.

## Customer task cards (read aloud in Polish)
| # | Card | Done when | Watch for |
|---|---|---|---|
| C1 | "Jesteś w restauracji z trzema znajomymi. Wszystkie stoliki są zajęte. Zapisz się do kolejki." | The status or alerts screen shows A-014 | Do they find the party-size stepper? Do they skip or fight the consent box? Do they enter a phone number, and why? |
| C2 | "Co ten ekran od Ciebie chce? Co zrobisz?" (on the alerts screen) | They choose an option | Do they understand that the page must stay open, and the locked-phone warning? |
| C3 | "Ile jeszcze poczekasz? Ile osób jest przed Tobą? Do kiedy możesz wyjść na papierosa?" | They read all three | Do they read "15–20 min" as a range and find the "come back by" time? |
| C4 | Put the phone face up on the table and talk with them until it alerts. "Co się stało? Co zrobisz?" | They tap "Już idę" | Did they notice the alert? How fast? Is "stanowisko hostessy" clear? |
| C5 | Tap "Zacznij od nowa (test)", join again, then: "Zmieniłeś zdanie, idziecie gdzie indziej. Zrezygnuj z miejsca." | The "You left the queue" screen | Do they find "Opuść kolejkę" at the bottom? |

## Staff task cards (read aloud in Polish)
| # | Card | Done when | Watch for |
|---|---|---|---|
| S1 | "Zwolnił się stolik dla dwóch osób. Kogo wołasz? Wezwij go." | They call A-012 (longest wait) | Do they compare wait times or just take the top row? |
| S2 | "Ups, to był zły stolik. Cofnij to." | The call is undone | Do they find "Cofnij" before it matters? |
| S3 | "Komu nie dojdzie powiadomienie na telefon? Co z tym zrobisz?" | They name Michał (A-015) and say they would call out the name | Is "alerty wyłączone — zawołaj" noticed without help? |
| S4 | "Piotr był wołany 7 minut temu i nie przyszedł. Co robisz?" | They choose "Wezwij ponownie" or "Nie przyszedł" | Is "PO CZASIE" understood? Which action and why? |
| S5 | "Przyszedł pan Marek z dwójką znajomych, nie ma telefonu przy sobie. Dodaj go do kolejki z notatką, że potrzebuje krzesełka dla dziecka." | The QR screen shows his ticket | Do they pick 3 people? Do they read the notice to the customer? What do they do on the QR screen? |
| S6 | "Anna z kolejki dla 3–4 osób właśnie usiadła przy stoliku. Zaznacz to." | Anna (B-004) is gone after "Wezwij" then "Obsłużony" | Do they switch the queue tab? Do they need to call first? |

## Closing questions
- Customers: "Co Ci się podobało? Co Cię zirytowało? Czy coś było niejasne? Zostawiłbyś tę stronę otwartą, czy zablokowałbyś telefon?"
- Staff: "Czego brakuje, żeby tego używać w piątek wieczorem? Co jest za małe albo za duże? Czy coś chciałbyś zrobić jednym dotknięciem?"
- Both: "Gdybyś miał zmienić jedną rzecz, co by to było?"

## Notes sheet
Copy one per participant.

| Participant | Role | Device | Date |
|---|---|---|---|
| P_ | customer / staff | | |

| Task | Done (yes / with help / no) | Time | Ease 1–7 | Hesitations and quotes |
|---|---|---|---|---|
| | | | | |

Closing answers:

## After the sessions
List every finding with how many participants hit it, sorted by how much it blocked them. Send the list to Claude: the findings and the changes they lead to go into the plan's "User test" section, and the mockups are updated before approval (plan step 5).
