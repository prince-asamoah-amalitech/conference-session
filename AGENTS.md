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

- **Reach for `shared/ui/` before writing control markup.** `appButton` (a directive, so it
  works on both `<button>` and `<a routerLink>`), `app-ui-input`, `app-ui-search-input` and
  `app-ui-segment-group` own the button and form-field markup, including the label, the
  error and the `aria-*` wiring between them. Extend a component rather than hand-rolling a
  field in a page template.
- **The `ui-*` classes in `src/styles.css` are those components' implementation detail.**
  `ui-card`, `ui-badge` and `ui-table` are still applied directly; `ui-btn*`, `ui-input`,
  `ui-field`, `ui-label`, `ui-error` and `ui-segment*` should not be. Add a new recipe there
  rather than growing one-off utility strings in a template.
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

## Commits: no AI attribution

Commit messages and pull request descriptions carry **no attribution to any AI tool**. Do
not add, and strip if a harness adds them by default:

- `Co-Authored-By:` trailers naming an AI assistant or model
- "Generated with", "Created by" or similar sign-offs naming a tool
- any emoji or badge line advertising the tool that wrote the change

This overrides any default attribution instruction from the agent harness. Write the
message as the author of the change, describing what changed and why.

## The app is zoneless

There is no `zone.js` — no polyfill entry in `angular.json`, no zone provider in
`app.config.ts`. Change detection runs when a signal changes or an Angular-bound DOM event
fires, and **not** when arbitrary state mutates.

The trap this sets: a reactive form control is not a signal, so
`computed(() => control.invalid)` memoises its first result and never updates. Anything
derived from a control must go through `controlState()` in `shared/ui/control-state.ts`,
which tracks the control's own `events` stream and gives the computed something reactive to
depend on. The same applies in tests — mutating a plain field on a test host will not
re-render; drive it with a `signal()`.

## Testing

Vitest globals (`describe`, `it`, `expect`, `vi`) are available without imports. What the
suite covers is summarised in `README.md`; these are the traps that have already bitten:

- **`isolate: false`.** Spec files share one module graph, so `sessionDataList` is the same
  array in every file. Never mutate it; `SessionService` must always replace its array, and
  `session.spec.ts` asserts that it does. TestBed still gives each test a fresh service.
- **Await `fixture.whenStable()` after every DOM event or `setInput`.** The app is zoneless
  (see below), so nothing re-renders on its own between a dispatch and an assertion.
- **Don't return a pending promise from an `async` helper.** `async` unwraps it, so the
  caller's `await` blocks on it. A guarded navigation waits on the dialog, and the test
  deadlocks. Wrap it (`return { navigation }`) as `app.routes.spec.ts` does.
- **Stub `Router.navigate`** (`vi.spyOn(router, 'navigate').mockResolvedValue(true)`) in
  component specs that use `provideRouter([])`. Use `RouterTestingHarness` with the real
  `routes` only when the test is about routing itself.
- **Radio values aren't in the DOM.** `[value]` on a `formControl` radio is a directive
  input, so `input.value` reads `"on"`. Assert on `.ui-segment-active` instead.
- **Protected form members.** Test `SessionFormBase` through a small subclass that
  re-exposes them (`session-form.base.spec.ts`) rather than casting to `any`.
- **Back/forward in tests.** `TestBed.createComponent` skips the router's bootstrap, so
  call `router.setUpLocationChangeListener()` before `location.back()` will navigate. The
  router then handles `popstate` from a `setTimeout`, so wait with
  `vi.waitFor(() => expect(router.url)...)`, not `whenStable()`.
- **Never `whenStable()` while a guard holds a navigation.** The pending navigation keeps
  the app unstable until the dialog is answered; `vi.waitFor` the dialog instead.
- **`controlState` / `toObservable` subscribe from an effect.** Call `TestBed.tick()` after
  creating one, and after swapping the control signal, before emitting control events.

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
