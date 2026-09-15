# localStorage → backend migration (Phase 30 §17)

Non-destructive by design: nothing below deletes or modifies the browser's
localStorage. The migration is a one-way **read** from an exported JSON
file into this backend's database — the frontend keeps working exactly as
it does today, reading/writing the same localStorage keys, until each
screen is individually switched over to the API in a later phase.

## 1. Export the data (run in the browser console, on the Recruiting app)

This is a plain read of `localStorage` — it changes nothing. Paste into
the browser devtools console while the Recruiting app is open, then save
the file it downloads:

```js
const keys = ['skillvision_candidates_data', 'apex5d_cv_matching_state']
const out = {
  candidates: JSON.parse(localStorage.getItem(keys[0]) || '[]'),
  cvMatchingState: JSON.parse(localStorage.getItem(keys[1]) || '{"companies":[],"activeContext":{}}'),
}
const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
const a = document.createElement('a')
a.href = URL.createObjectURL(blob)
a.download = `recruiting-export-${new Date().toISOString().slice(0, 10)}.json`
a.click()
```

## 2. Run the migration script

```bash
cd backend
npm run migrate:localstorage -- --input /path/to/recruiting-export.json --dry-run   # report only, writes nothing
npm run migrate:localstorage -- --input /path/to/recruiting-export.json             # actually writes
```

See `scripts/migrate-localstorage.ts` for the exact mapping logic; the
summary below is what it does today and, just as importantly, what it
deliberately does not.

## 3. Key-by-key map

| localStorage key | Covered by the script? | Where it goes | Notes |
|---|---|---|---|
| `skillvision_candidates_data` | Yes | `Candidate` rows (unlinked to any campaign) | Matches the Blueprint §9 map — these were never reliably tied to one opening in the old model, so they land as standalone Candidate records. A recruiter links them to a campaign manually afterward, same action as adding any existing candidate to a campaign today. |
| `apex5d_cv_matching_state` | Yes | `Company` → `Campaign` → `JobProfile`, `candidatePool[]` entries → `Candidate` + `CampaignCandidate` | Company/opening matched by **name** (there's no other stable key across the two systems); re-running is safe for these. |
| `apex5d_jd_templates` | **No** | — | Role-keyed JD editor state. Folds conceptually into `JobProfile.sections` per the Blueprint, but needs a human decision on which role's template applies to which real Campaign — there's no reliable automatic mapping from "role name" to "the right campaign." |
| `apex5d_job_postings_summaries` | **No** | — | Same role-keying problem, plus the Blueprint itself flagged this key's destination as ambiguous (job ad vs. candidate-facing content) — not resolved, not migrated. |
| `apex5d_salary_benefits` | **No** | — | Role-keyed; same reasoning as JD templates above. |
| `apex5d_survey_state` | **No** | — | A single link per role; low value to auto-migrate versus just re-entering it once per real campaign post-migration. |
| `apex5d_interview_protocol` | **No** | — | The Blueprint explicitly calls this the hardest migration in the whole map: it's keyed by role today, with a free-text `candidateId` field the source code itself says was never a real reference ("CAND-014", never a selector — see `CompareRowsTable.tsx`). Turning that into real `Evaluation` rows needs a human matching names to real candidates, not a script guessing wrong and getting an evaluation attached to the wrong person. |
| `sv_shell_auth` / `sv_shell_user` | N/A | — | Session flags, not data — superseded by real login (§8), nothing to migrate. |
| `CvMatchingState.activeContext` | N/A | — | Per-user UI navigation state, not data — stays client-side. |
| `Candidate.fileUrl` | **No** (can't be) | — | A `URL.createObjectURL()` reference, valid only for the browser tab that created it — already gone by the time an export happens. This is the clearest evidence CV files were never actually persisted anywhere; every candidate migrated by this script has no attached `Cv`/`StoredFile` row unless it's re-uploaded through the new upload endpoint. |

## 4. Known limitation: candidates without an email can't be de-duplicated

The script matches existing candidates by normalized email (same rule as
the live `/candidates/suggest-match` endpoint, OD-4). Most of today's demo
candidate records have **no email at all** — for those, the script cannot
tell "already migrated" from "a new person with the same name," so it
creates a fresh row every time it's run. **Run the script once per
environment for a given export**, not repeatedly, until real candidate
data (which generally does carry an email) is what's being migrated.

## 5. What's explicitly NOT claimed

- Nothing here deletes the original localStorage data — do that manually,
  later, only once the team is confident the backend is the source of
  truth (out of scope for this phase, and the brief says not to).
- The script does not compute or backfill AHI scores, match results, or
  fascia for migrated candidates with no real CV — those fields stay empty
  until a real CV is uploaded and matched through the new endpoints.
