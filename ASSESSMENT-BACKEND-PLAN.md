# Assessment backend: plan

Date: 14 October 2026

Today the Assessment module keeps all its data in the browser. This plan moves it
to the backend (PostgreSQL), the same one Recruiting already uses.

Detailed technical version, in Italian: `PROGETTO-ASSESSMENT-SERVER.md` §8.

---

## The plan

### ✅ Done
1. Database tables for Assessment
2. Backend features for saving and reading Assessment data
3. Running everything on your computer (offline), with Railway later

### ✅ Part 1: Connect the screens (done 15 October, tested on the local computer)
- Assessment screens load and save through the backend instead of the browser.
- "Importa dati del browser" button in the sidebar (admins only), so each company moves its current browser data to the backend.
- Absence reason is a dropdown (holiday, leave, training, statutory leave, other).
- Salary is hidden from users who aren't admins.
- If the server can't be reached, the app says so and offers "Riprova" instead of saving silently.

### ✅ Part 2: Evaluator link (done 15 October, tested on the local computer)
- The link sent to an outside evaluator works on any computer, not only the HR person's.
- The link closes once the evaluation is sent; HR sees it as completed.

### ✅ Part 3: Sending test links (done 15 October, tested on the local computer)
- HR ticks employees and clicks "Invia link test", and the backend sends the emails,
  the same way Recruiting does. Each person shows sent or failed, with the reason.
- No email key is kept in the browser anymore. On Railway it uses Recruiting's existing email settings.

### ⬜ Part 4: Valutazione 5P (about 1 hour)
- 5P saves to the backend and uses the same employees as the employee list.
- **Needs one answer:** names from the Excel file that aren't in the employee list
  get added as new employees?

### ⬜ Part 5: Check everything (1–2 hours)
- Test every Assessment screen, in light and dark mode.

### ⬜ Part 6: Go live (when you decide)
- Push to Railway. Each company clicks "Import data" once.

**Total remaining: about 2–3 hours, plus going live.**

---

## Decisions already taken

| # | Question | Decision |
|---|---|---|
| 1 | How to store the data | Mixed: proper tables for employees, scores, periods, assignments and job roles; simple documents for the rest |
| 2 | Are 5P people the same as the employees? | Yes |
| 3 | Sensitive data (salary, sex, absences) | Approved. Salary visible only to admins; absence reason becomes a category, never free text |
| 4 | Import today's browser data? | Yes |
| 5 | Use TanStack Query in the frontend | Yes |
| 6 | Compare employees across companies | Not in this project |

---

## How the app works after the migration

- **Data is safe.** Clearing the browser, changing computer or using a new laptop
  loses nothing; it's all on the server.
- **Everyone sees the same data.** Two HR people at the same company see the same
  employees and evaluations.
- **Companies are separated.** Each company sees only its own data. Skill Vision
  staff see all companies.
- **Login is needed.** Assessment data is only visible after logging in.
- **Evaluator links work anywhere.** An outside evaluator opens the link on their
  own computer and submits.
- **Emails come from the server.** No email keys are stored in the browser anymore.
- **Saving needs internet.** If the connection drops, the app shows a clear message
  instead of saving silently.
- **Screens look the same.** Same pages, same buttons. Only three small differences:
  - absence reason is a dropdown;
  - non-admins don't see salary;
  - pages show a short loading moment while data comes from the server.

---

## Good to know

- **Nothing is on Railway yet.** All work is on the local computer until you
  decide to push.
- **Pushing to Railway updates the production database automatically.** The
  change only adds new tables; no existing Recruiting data is touched.
- **There is a switch back.** Until everything is confirmed, the app can be put
  back on browser storage with one setting (`VITE_ASSESSMENT_STORAGE=local`).
