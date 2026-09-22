# AGENTS.md

Working notes for coding agents in this repo. Read this before editing; it records the
conventions that are already in the code and the things that are easy to get wrong.

## What this is

An Angular 22 admin area for managing conference sessions. Single app, no backend — the
brief is in `tasks.md`, the functional spec in `docs/README.md`.

## Commands

```bash
npm start                 # ng serve on http://localhost:4200
npm run build             # production build into dist/
npm test                  # ng test (Vitest + jsdom), runs once in CI mode with --watch=false
npx tsc --noEmit -p tsconfig.app.json   # fast typecheck without a build
```

Run `npm test -- --watch=false` when you need a single pass. There is no lint script.

## Architecture

- **Standalone components throughout.** No NgModules. Providers live in
  `src/app/app.config.ts`.
- **Signals, not RxJS, for component state.** `input()`, `output()`, `signal()`,
  `computed()`, `viewChild()`. `rxjs` is present only as an Angular peer dependency.
- **The session feature area is lazy.** `app.routes.ts` → `loadChildren` →
  `session-page/session.routes.ts` → per-route `loadComponent`. Keep it that way; eager
  imports from `app.*` into `session-page/**` would defeat it.
- **`SessionService` is the only data source** (`session-page/services/session.ts`). It
  holds an in-memory `signal<Session[]>` seeded from `data/session.data.ts`. The brief
  says **do not change its public API**.
- **Search term lives in the URL.** `SessionPage` reads `q` as a routed `input()`, which
  works because `provideRouter` is configured with `withComponentInputBinding()`. Removing
  that feature silently breaks refresh-persistence and shareable links. The `input()` has a
  `transform` because the router binds `undefined` when the param is absent, which would
  otherwise shadow the default.
- **Unsaved-changes flow.** `SessionFormBase` (`session-page/components/session-form.base.ts`)
  owns the reactive form, the speakers `FormArray`, and a promise that `canDeactivate()`
  returns while `SaveChangesDialog` is open. `unsavedChangesGuard`
  (`session-page/guards/unsaved-changes-guard.ts`) just calls
  `component.canDeactivate()`. `CreateSession` and `EditSession` both extend the base —
  put shared form logic there, not in the two components.

## Styling

Tailwind v4, configured through `src/styles.css` (`@import 'tailwindcss'` +
`@config '../tailwind.config.js'`).

- **Use the `ui-*` component classes in `src/styles.css`.** `ui-btn`, `ui-input`, `ui-card`,
  `ui-badge`, `ui-table`, etc. Add a new recipe there rather than growing one-off utility
  strings in a template.
- **Never hardcode a hex value in a template.** `tailwind.config.js` mirrors the handoff
  design tokens (primitive ramps + semantic `page`/`surface`/`content`/`stroke` groups).
  Reach for `text-content-secondary`, `border-stroke-light`, `bg-navy-50` and so on.
- Fonts: Poppins (`font-display`, headings) and Inter (`font-body`, everything else).

## Design handoff — read before changing any UI

`docs/designs/` is a Claude Design handoff bundle. **The page-level mockup it names
(`project/Conference Sessions Flow.dc.html`) is missing from the bundle and is not in git**,
so there is no pixel reference for page layouts. What _is_ present and authoritative is the
design system at `docs/designs/project/_ds/unified-experience-design-system-<id>/`:

- `_ds_bundle.js` — every component's exact spec (React source, inline styles). Grep it for
  the component name, e.g. `components/Modal.jsx`, to get real numbers for padding, radius,
  shadow and colour tokens.
- `tokens/colors.css` — single source of truth for colour, including the `buttons-*` token
  sets that define each button colour/variant/state.

Match the design system when adding UI, and say so in the commit. If a spec and the existing
`ui-*` layer disagree on a semantic token, prefer the existing layer for consistency and note
the deviation.

## Conventions

- Prettier is configured (`.prettierrc`); match the surrounding formatting.
- Comments explain _why_, and are sparse. Follow the existing density — don't narrate code.
- Every component has a `.spec.ts` beside it. Add one for anything new.
- Angular 22 control flow (`@if`, `@for`, `@else`) in templates, not `*ngIf`/`*ngFor`.
- `protected` for template-only members, `readonly` for signals and injected deps.

## Keep `docs/README.md` current

`docs/README.md` is the functional spec, and it is expected to describe the app as it
actually is. Update it in the same change as the code — not afterwards — whenever you touch:

- a route, or the behaviour of one
- a component in the components list, or add/remove/rename one
- a validation rule
- the `Session` or `Speaker` model
- the `SessionService` API
- the design handoff bundle

A change that makes the spec wrong is not finished. If the code intentionally diverges from
a requirement, say so there rather than leaving the two to disagree. Where a change also
affects how the app is run, laid out or explained to a newcomer, update `README.md` too.
