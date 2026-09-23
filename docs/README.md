# Functional requirements

The spec for the conference sessions admin area, and how it maps onto the code.
The original brief is in `tasks.md`; implementation conventions are in `AGENTS.md`.

## Requirements

- A session page showing a list of sessions on the `/sessions` route, with a search box to
  filter the sessions and a new session button to create one. The list is ordered newest
  first, so a session you have just created appears at the top.
- Refreshing the page should keep the search term in the search input.
- The link to the search term and its results must be shareable.
- Clicking a session list item should navigate to the session details on `/sessions/:id`
  with an edit session form.
- Create a new session by clicking the new session button, which shows the create session
  page on `/sessions/new`.
- Forms must have validations.
- A Page Not Found page should be displayed for any unknown route.
- Warn users about unsaved changes on the form when they try to navigate away.
- The session feature area must be loaded lazily.
- Data comes from the provided `SessionService` — its API must not change.

### How the trickier ones are satisfied

| Requirement                                | Implementation                                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Search survives refresh, link is shareable | The term is held in the `q` query parameter, not component state. `SessionPage` reads it as a routed `input()`, enabled by `withComponentInputBinding()` in `app.config.ts`. Typing uses `replaceUrl: true` so the back button is not flooded.   |
| Unsaved-changes warning                    | A `canDeactivate` guard delegates to the routed component. A dirty form opens `SaveChangesDialog` and returns a promise that resolves on the user's answer. A successful submit marks the form pristine, so saving then leaving does not prompt. |
| Lazy feature area                          | `app.routes.ts` lazy-loads `session-page/session.routes.ts`, which lazy-loads each page component in turn.                                                                                                                                       |

## Routes

| Route           | Component       | Notes                                     |
| --------------- | --------------- | ----------------------------------------- |
| `/`             | —               | Redirects to `/sessions`                  |
| `/sessions`     | `SessionPage`   | Accepts `?q=<term>`; newest created first |
| `/sessions/new` | `CreateSession` | Guarded by `unsavedChangesGuard`          |
| `/sessions/:id` | `EditSession`   | Guarded by `unsavedChangesGuard`          |
| `**`            | `PageNotFound`  |                                           |

## Components

- **SessionPage** — lists all sessions with a search input and a new session button.
- **SessionList** — renders the session items.
- **PageNotFound** — shows a message saying the page was not found.
- **CreateSession** — page showing a form to create a session.
- **EditSession** — page showing details and a form to edit a session.
- **SaveChangesDialog** — asks the user to confirm before leaving with unsaved changes.

`CreateSession` and `EditSession` share `SessionFormBase`, which owns the reactive form,
the speakers `FormArray`, and the unsaved-changes prompt.

## Validation rules

| Field                 | Rule                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| `title`               | Required, 120 characters max                                                      |
| `track`               | Required; one of `frontend`, `backend`, `ai`                                      |
| `startsAt` / `endsAt` | Both required; `endsAt` must be strictly after `startsAt` (cross-field validator) |
| `capacity`            | Required whole number, 1–10,000                                                   |
| `speakers`            | At least one; each speaker needs a name (80 characters max) and a valid email     |

Errors surface once a control is touched or dirty.

## Data models

```ts
export interface Speaker {
  name: string;
  email: string;
}

export interface Session {
  id: string;
  title: string;
  track: 'frontend' | 'backend' | 'ai';
  startsAt: string; // ISO
  endsAt: string; // ISO
  capacity: number;
  speakers: Speaker[];
}
```

`startsAt` and `endsAt` are ISO strings in the model and are converted to and from the
local `YYYY-MM-DDTHH:mm` value that a `datetime-local` input expects.

## SessionService

In-memory, signal-backed, seeded from `session-page/data/session.data.ts`. The API is fixed:

| Member              | Purpose                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `all`               | Readonly signal of every session                                                                    |
| `count`             | Computed session count                                                                              |
| `search(term)`      | Case-insensitive match on title, track, and speaker name or email; an empty term returns everything |
| `getById(id)`       | One session, or `undefined`                                                                         |
| `create(draft)`     | Appends a session with a generated `s-NNN` id and returns it                                        |
| `update(id, draft)` | Replaces the editable fields in place; `false` (and no change) when the id is unknown               |
| `remove(id)`        | Deletes a session; an unknown id is a no-op                                                         |

Every mutation replaces the array rather than editing it, so the seed data is never
modified. Ids are one past the highest numeric id currently held, zero-padded to three
digits and widening past `s-999`. The id is always the service's: an `id` field smuggled in
on a draft is ignored by both `create` and `update`.

> **Known limitation:** because ids come from the highest id _currently_ present, removing
> the newest session and then creating one reissues the removed id. Nothing in the app
> calls `remove`, so this cannot happen through the UI today.

## Design handoffs

Project UI designs are in `docs/designs/` — a handoff bundle exported from
[Claude Design](https://claude.ai/design).

> **The page-level mockup is missing.** The bundle's own README points at
> `project/Conference Sessions Flow.dc.html` as the primary design, but that file is not in
> the bundle and was never committed, so there is no pixel reference for page layouts.
> Re-export the bundle if you need one.

What _is_ present is the design system, and it is authoritative for individual components:

```
docs/designs/project/_ds/unified-experience-design-system-<id>/
  _ds_bundle.js       every component's exact spec (React source with inline styles)
  styles.css          entry point; imports the token files
  tokens/colors.css   single source of truth for colour, incl. the buttons-* token sets
  tokens/…            typography, spacing, effects, dimensions, per-mode themes
```

To check a component against the design, grep `_ds_bundle.js` for its source path — for
example `components/Modal.jsx` — and read the inline styles for real padding, radius,
shadow and token values. `tailwind.config.js` mirrors these tokens for the app, using the
"Light Mode (Dark Blue)" theme as the default.
