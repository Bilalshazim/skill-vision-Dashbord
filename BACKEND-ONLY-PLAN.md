# Everything on the server: plan

Date: 21 October 2026

Goal: nothing is kept in the browser. All data, and even screen preferences
(light/dark, language, open panels), is saved on the server.

Detailed technical version, in Italian: `PROGETTO-TUTTO-SUL-SERVER.md`.

---

## The plan

| # | Part | Hours |
|---|---|---|
| 1 | Assessment on the server only (no browser mode left). Importing browser data also deletes it from the browser. | 2–3 |
| 2 | Preferences (theme, language, open panels, chosen company) saved on the user's account | 3–4 |
| 3 | Remove the old login page and its browser session | 3–4 |
| 4 | Recruiting: companies and job openings from the server | 5–7 |
| 5 | Recruiting: candidates and ranking from the server | 7–9 |
| 6 | Recruiting: pipeline (shortlist, test results, interviews, chosen candidate) | 6–8 |
| 7 | Recruiting: job description templates, ad summaries, salary and benefits | 4–5 |
| 8 | Recruiting: questionnaire links, interview protocol, skill priorities | 3–4 |
| 9 | Recruiting: import today's browser data, then delete it from the browser | 3 |
| 10 | Full check, plus an automatic check that fails if browser storage comes back | 2–3 |
| | **Total** | **38–50** |

## Needs one answer

**The 5P evaluator form.** Today it is an HTML file sent by email; it saves the
evaluator's answers in the evaluator's own browser. To follow the rule it must
become an online link (like the Assessment evaluator link), with answers saved
on the server. This changes how the 5P process works for the client. Yes or no?
(If yes: 5–7 hours more.)

## The one thing that stays

The **login cookie**. The server sets it, the app's code cannot read it, and
without it every page reload would ask for the password again. It holds no data.
