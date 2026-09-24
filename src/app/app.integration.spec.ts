import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

/**
 * End-to-end journeys through the whole app: the real App shell, routes, lazy-loaded
 * pages, SessionService and unsaved-changes guard. Nothing is stubbed except the browser
 * location, and every step goes through the DOM the way a user would — clicking links and
 * buttons, typing into fields — and then checks both the URL and what is on screen.
 */
describe('Conference sessions app (integration)', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let location: Location;

  const screen = () => fixture.nativeElement as HTMLElement;
  const text = () => screen().textContent!.replace(/\s+/g, ' ');
  const heading = () => screen().querySelector('h1')?.textContent?.trim();
  const url = () => router.url;

  const rows = () => Array.from(screen().querySelectorAll('tbody tr'));
  const rowTitles = () => rows().map((row) => row.querySelector('a')!.textContent!.trim());
  const dialog = () => screen().querySelector('[role="alertdialog"]');

  function find<T extends HTMLElement>(selector: string, label: string): T {
    const match = Array.from(screen().querySelectorAll<T>(selector)).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!match) {
      throw new Error(`No ${selector} labelled "${label}" on ${url()}`);
    }
    return match;
  }

  const field = (name: string, index = 0) =>
    screen().querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)[index];

  /** Lets navigations, lazy loads and rendering finish. */
  const settle = () => fixture.whenStable();

  async function clickLink(label: string) {
    find('a', label).click();
    await settle();
  }

  async function clickButton(label: string) {
    find('button', label).click();
    await settle();
  }

  async function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await settle();
  }

  async function search(term: string) {
    await type(screen().querySelector<HTMLInputElement>('input[type="search"]')!, term);
  }

  async function chooseTrack(track: string) {
    find<HTMLLabelElement>('label.ui-segment', track).click();
    await settle();
  }

  async function submitForm() {
    await clickButton('Save session');
  }

  /**
   * Starts a navigation the guard will hold open and waits for its dialog. Deliberately
   * not awaiting settle() here: the pending navigation keeps the app from becoming stable
   * until the dialog is answered.
   */
  async function clickAndExpectPrompt(link: HTMLAnchorElement) {
    link.click();
    await vi.waitFor(() => expect(dialog()).not.toBeNull());
  }

  /** Boots a fresh app at the given URL, as a page load or a pasted link would. */
  async function launch(startUrl: string) {
    TestBed.configureTestingModule({
      // The real providers (router with input binding included), so this breaks if
      // app.config drops something the app needs. Only the browser location is faked.
      providers: [...appConfig.providers, provideLocationMocks()],
    });

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    // Bootstrap does this via initialNavigation(); TestBed does not, and without it the
    // router never hears about back/forward.
    router.setUpLocationChangeListener();
    await router.navigateByUrl(startUrl);
    await settle();
  }

  describe('browsing and searching', () => {
    beforeEach(() => launch('/'));

    it('lands on the session list inside the app shell', () => {
      expect(url()).toBe('/sessions');
      expect(text()).toContain('Conference Sessions');
      expect(heading()).toBe('Sessions');
      expect(rows()).toHaveLength(10);
      expect(text()).toContain('10 sessions');
    });

    it('filters as the user types and keeps the term in the URL', async () => {
      await search('postgres');

      expect(url()).toBe('/sessions?q=postgres');
      expect(rowTitles()).toEqual(['Postgres Performance for Application Developers']);
      expect(text()).toContain('1 session matching “postgres”');
    });

    it('finds sessions by speaker email', async () => {
      await search('grace.osei@');
      expect(rowTitles()).toEqual(['Event Sourcing Without the Regret']);
    });

    it('shows the empty state, and clearing the search restores the list', async () => {
      await search('cobol');
      expect(rows()).toHaveLength(0);
      expect(text()).toContain('No sessions found');

      await search('');
      expect(url()).toBe('/sessions');
      expect(rows()).toHaveLength(10);
    });

    it('replaces the history entry while typing instead of stacking one per keystroke', async () => {
      await clickLink('New session');
      await clickLink('Back to sessions');

      for (const term of ['a', 'ap', 'api']) {
        await search(term);
      }
      expect(url()).toBe('/sessions?q=api');

      // One step back skips every intermediate term. The router handles popstate from a
      // setTimeout, so wait for the URL rather than for stability.
      location.back();
      await vi.waitFor(() => expect(url()).toBe('/sessions/new'));
    });

    it('opens a session from its title and returns via the app bar', async () => {
      await clickLink('Designing Idempotent REST APIs');

      expect(url()).toBe('/sessions/s-002');
      expect(heading()).toBe('Edit session');
      expect(field('title').value).toBe('Designing Idempotent REST APIs');
      expect(field('name').value).toBe('Kwame Mensah');

      await clickLink('Conference Sessions');
      expect(url()).toBe('/sessions');
    });

    it('opens a session by clicking anywhere on its row', async () => {
      rows()[0].querySelector<HTMLElement>('td:last-child')!.click();
      await settle();

      // Newest first, so the top row is the highest id.
      expect(url()).toBe('/sessions/s-010');
      expect(field('title').value).toBe('Accessible Components from the First Commit');
    });
  });

  describe('a shared search link', () => {
    it('restores the filtered view and the search box on load', async () => {
      await launch('/sessions?q=vector');

      expect(screen().querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe(
        'vector',
      );
      expect(rowTitles()).toEqual(['Vector Databases: Indexes, Trade-offs, and Costs']);
    });
  });

  describe('creating a session', () => {
    beforeEach(async () => {
      await launch('/sessions');
      await clickLink('New session');
    });

    it('opens an empty form', () => {
      expect(url()).toBe('/sessions/new');
      expect(heading()).toBe('New session');
      expect(field('title').value).toBe('');
    });

    it('saves a new session, opens it, and lists it first', async () => {
      await type(field('title'), 'Zoneless Angular in Production');
      await chooseTrack('ai');
      await type(field('startsAt'), '2026-10-14T09:00');
      await type(field('endsAt'), '2026-10-14T10:30');
      await type(field('capacity'), '250');
      await type(field('name'), 'Ama Boateng');
      await type(field('email'), 'ama@example.com');

      await clickButton('+ Add speaker');
      await type(field('name', 1), 'Kofi Annan');
      await type(field('email', 1), 'kofi@example.com');

      await submitForm();

      // Lands on the new session's edit page, with every value round-tripped.
      expect(url()).toBe('/sessions/s-011');
      expect(heading()).toBe('Edit session');
      expect(field('title').value).toBe('Zoneless Angular in Production');
      expect(field('startsAt').value).toBe('2026-10-14T09:00');
      expect(field('endsAt').value).toBe('2026-10-14T10:30');
      expect(field('capacity').value).toBe('250');
      expect(field('email', 1).value).toBe('kofi@example.com');
      expect(screen().querySelector('.ui-segment-active')?.textContent?.trim()).toBe('ai');

      // Saved, so leaving does not prompt.
      await clickLink('Back to sessions');
      expect(dialog()).toBeNull();
      expect(url()).toBe('/sessions');
      expect(rows()).toHaveLength(11);
      expect(rowTitles()[0]).toBe('Zoneless Angular in Production');

      await search('kofi@');
      expect(rowTitles()).toEqual(['Zoneless Angular in Production']);
    });

    it('refuses an invalid form and stays put', async () => {
      await type(field('title'), 'Backwards session');
      await type(field('startsAt'), '2026-10-14T10:00');
      await type(field('endsAt'), '2026-10-14T09:00');
      await submitForm();

      expect(url()).toBe('/sessions/new');
      expect(text()).toContain('The end time must come after the start time.');
      expect(text()).toContain('A speaker name is required.');
    });

    it('cancels without creating anything', async () => {
      await clickButton('Cancel');

      expect(url()).toBe('/sessions');
      expect(rows()).toHaveLength(10);
    });
  });

  describe('editing a session', () => {
    beforeEach(async () => {
      await launch('/sessions');
      await clickLink('Designing Idempotent REST APIs');
    });

    it('saves the change and shows it in the list', async () => {
      await type(field('title'), 'Designing Idempotent HTTP APIs');
      await type(field('capacity'), '120');
      await submitForm();

      expect(url()).toBe('/sessions');
      expect(rowTitles()).toContain('Designing Idempotent HTTP APIs');
      expect(rowTitles()).not.toContain('Designing Idempotent REST APIs');
      expect(rows()).toHaveLength(10);

      await clickLink('Designing Idempotent HTTP APIs');
      expect(field('capacity').value).toBe('120');
    });

    it('refuses an invalid edit and stays put', async () => {
      await type(field('email'), 'not-an-email');
      await submitForm();

      expect(url()).toBe('/sessions/s-002');
      expect(text()).toContain('A valid email address is required.');
    });

    it('shows a not-found state for a session that does not exist', async () => {
      await router.navigateByUrl('/sessions/s-999');
      await settle();

      expect(heading()).toBe('Session not found');
      await clickLink('Back to sessions');
      expect(url()).toBe('/sessions');
    });
  });

  describe('leaving with unsaved changes', () => {
    beforeEach(async () => {
      await launch('/sessions');
      await clickLink('Designing Idempotent REST APIs');
      await type(field('title'), 'Half-finished edit');
      expect(text()).toContain('Unsaved changes');
    });

    it('stays on the page, with the edit intact, when the user chooses to', async () => {
      await clickAndExpectPrompt(find('a', 'Conference Sessions'));
      await clickButton('Stay on page');

      expect(dialog()).toBeNull();
      expect(url()).toBe('/sessions/s-002');
      expect(field('title').value).toBe('Half-finished edit');
    });

    it('discards the edit and leaves when the user confirms', async () => {
      await clickAndExpectPrompt(find('a', 'Back to sessions'));
      await clickButton('Discard and leave');

      expect(url()).toBe('/sessions');
      expect(rowTitles()).toContain('Designing Idempotent REST APIs');
      expect(rowTitles()).not.toContain('Half-finished edit');
    });

    it('prompts on browser back too', async () => {
      location.back();
      await vi.waitFor(() => expect(dialog()).not.toBeNull());
      await clickButton('Stay on page');

      expect(field('title').value).toBe('Half-finished edit');
    });

    it('does not prompt after the change is saved', async () => {
      await submitForm();
      expect(dialog()).toBeNull();
      expect(url()).toBe('/sessions');
    });
  });

  describe('unknown URLs', () => {
    it('shows Not Found and links back to the list', async () => {
      await launch('/does/not/exist');

      expect(heading()).toBe('Page not found');
      expect(text()).toContain('Conference Sessions');

      await clickLink('Back to sessions');
      expect(url()).toBe('/sessions');
      expect(rows()).toHaveLength(10);
    });
  });
});
