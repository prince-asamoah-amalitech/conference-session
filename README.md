# Conference Sessions

A small Angular admin area for managing conference sessions: browse and search a schedule,
create a session, and edit an existing one — with form validation, a variable number of
speakers, and an unsaved-changes warning on navigation.

Built with Angular 22 (standalone components, signals), Tailwind CSS v4, and Vitest.
There is no backend; data lives in memory and resets on reload.

Repository: <https://github.com/prince-asamoah-amalitech/conference-session>

## Getting started

```bash
git clone https://github.com/prince-asamoah-amalitech/conference-session.git
cd conference-session
npm install
npm start
```

Then open http://localhost:4200/. `/` redirects to `/sessions`.

## Scripts

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm start`     | Dev server with hot reload           |
| `npm run build` | Production build into `dist/`        |
| `npm run watch` | Development build, rebuilt on change |
| `npm test`      | Unit tests (Vitest + jsdom)          |

## Docker

```bash
docker build -t conference-sessions .
docker run --rm -p 8080:80 conference-sessions
```

Then open http://localhost:8080/. The image is a multi-stage build: Node compiles the
production bundle, and nginx serves it (`nginx.conf`) with an `index.html` fallback so deep
links such as `/sessions/new` survive a refresh.

## Testing

```bash
npm test -- --watch=false                                             # whole suite, once
npm test -- --watch=false --include src/app/session-page/services     # one folder or file
npx tsc --noEmit -p tsconfig.spec.json                                # typecheck the specs
```

Unit tests run on Vitest with jsdom through Angular's `@angular/build:unit-test` builder.
Every component, directive, service, guard and helper has a `.spec.ts` beside it (the model,
seed data and route tables are covered through their callers), and the suite covers each
layer on its own and then end to end:

| Layer                                     | What the specs pin down                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionService`                          | Seed state; search on every field, case and whitespace; id generation (sequential, zero-padded, past `s-999`); update/remove on known and unknown ids; immutability; signal reactivity |
| `SessionFormBase`, `toLocalInput`/`toIso` | Every validation rule at its boundary, the speakers `FormArray`, `patchFrom`/`toDraft` round-trip and trimming, the unsaved-changes promise                                            |
| `unsavedChangesGuard`                     | Passes the component's answer — boolean or pending promise — straight to the router                                                                                                    |
| Page components                           | Create/edit submit (valid and invalid), error messages, adding and removing speakers, the dialog's three exits, list ordering, search-to-URL, empty and not-found states               |
| `shared/ui/`                              | Class recipes, two-way control binding, error/`aria-*` wiring, and `controlState` tracking a control from a `computed()`                                                               |
| `app.routes.spec.ts`                      | Real router: redirect, lazy routes, `?q=` binding, Not Found, and the guard holding a navigation open until the dialog is answered                                                     |

Pitfalls worth knowing before writing a new spec are listed under _Testing_ in `AGENTS.md`.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests. It
typechecks, runs the unit tests, builds the production bundle (uploaded as the `dist`
artifact), then builds the Docker image and smoke-tests that the container serves the app
and falls back to `index.html` on a deep link. The image is not pushed anywhere.

## Routes

| Route                | Page                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `/sessions`          | Session list (newest created first), search box, "New session" button  |
| `/sessions?q=<term>` | The same list, filtered — the term is shareable and survives a refresh |
| `/sessions/new`      | Empty form in create mode                                              |
| `/sessions/:id`      | Edit form for one session                                              |
| anything else        | Not Found                                                              |

Everything under `/sessions` is lazily loaded, and each route within it loads its own
component.

## How it works

**Search lives in the URL.** `SessionPage` reads `q` as a routed input (the router is
configured with `withComponentInputBinding()`), and typing replaces the current history
entry rather than pushing a new one. That is what makes the filtered view both
refresh-proof and shareable. Matching is case-insensitive across title, track and speaker
name or email.

**One form, two modes.** `CreateSession` and `EditSession` share `SessionFormBase`, which
owns the reactive form, the speakers `FormArray`, and the validation rules:

- title — required, 120 characters max
- track — one of `frontend`, `backend`, `ai`
- starts/ends — both required, and the end must be strictly after the start (a cross-field
  validator)
- capacity — a whole number from 1 to 10,000
- speakers — at least one; each needs a name and a valid email

ISO timestamps are converted to and from the local value a `datetime-local` input expects,
so times round-trip through the form unchanged.

**Unsaved changes block navigation.** A `canDeactivate` guard calls into the routed
component. If the form is dirty, the component opens `SaveChangesDialog` and returns a
promise that stays pending until the user chooses to stay or discard. Submitting marks the
form pristine, so saving and leaving does not prompt.

**Data.** `SessionService` wraps an in-memory `signal<Session[]>` seeded from
`session-page/data/session.data.ts` and exposes `all`, `count`, `search`, `getById`,
`create`, `update` and `remove`. Its API is fixed by the brief.

## Project layout

```
src/app/
  app.config.ts            providers: router (+ component input binding), HttpClient
  app.routes.ts            root routes; lazy-loads the session area
  shared/ui/               presentational components shared across pages
    button/                appButton directive (button + anchor)
    input/                 labelled field: label, input, error/hint
    search-input/          the search box
    segment-group/         single-choice segmented control
    control-state.ts       makes a form control readable from a computed()
  session-page/
    session.routes.ts      routes for the lazy feature area
    session-page.*         the list page
    model/session.model.ts Session + Speaker
    data/session.data.ts   seed data
    services/session.ts    SessionService
    guards/
      unsaved-changes-guard.ts
    components/
      session-form.base.ts shared form logic for create + edit
      create-session/
      edit-session/
      session-list/
      save-changes-dialog/
      page-not-found/
```

## Styling

Tailwind v4, entered through `src/styles.css`. Design tokens live in `tailwind.config.js`
and mirror the handoff design system, so components use semantic names
(`bg-surface`, `text-content-secondary`, `border-stroke-light`) rather than raw hex values.
Reusable recipes — `ui-btn`, `ui-input`, `ui-card`, `ui-badge`, `ui-table` — are defined as
component classes in `src/styles.css`. Templates mostly do not apply them directly: the
components in `shared/ui/` own the button and form-control markup, and the `ui-*` classes
are their implementation detail.

## Documentation

- `docs/README.md` — functional requirements and the design handoff
- `AGENTS.md` — conventions and gotchas for anyone (or any agent) changing the code
- `tasks.md` — the original brief
