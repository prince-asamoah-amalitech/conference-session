import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { SessionService } from './session-page/services/session';

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  async function navigateTo(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return harness.routeNativeElement!;
  }

  /** Regression: the router binds `undefined` for an absent query param. */
  it('lists every session at /sessions with no query param', async () => {
    const element = await navigateTo('/sessions');
    expect(element.querySelectorAll('tbody tr').length).toBe(
      TestBed.inject(SessionService).count(),
    );
  });

  it('filters the list from the q query param', async () => {
    const element = await navigateTo('/sessions?q=postgres');
    expect(element.querySelectorAll('tbody tr').length).toBe(1);
    expect(element.querySelector('input[type="search"]')).toHaveProperty('value', 'postgres');
  });

  it('shows the create form at /sessions/new', async () => {
    const element = await navigateTo('/sessions/new');
    expect(element.textContent).toContain('New session');
  });

  it('shows the edit form at /sessions/:id, populated from the service', async () => {
    const session = TestBed.inject(SessionService).all()[0];
    const element = await navigateTo(`/sessions/${session.id}`);
    expect(element.textContent).toContain('Edit session');
    // The field components take their control as an input, so the native input carries
    // `name` rather than `formControlName`.
    expect(element.querySelector('input[name="title"]')).toHaveProperty('value', session.title);
  });

  it('shows page not found for an unknown url', async () => {
    const element = await navigateTo('/nope');
    expect(element.textContent).toContain('Page not found');
  });

  it('redirects / to /sessions', async () => {
    await navigateTo('/');
    expect(TestBed.inject(Router).url).toBe('/sessions');
  });

  it('shows the in-page not-found state for an unknown session id', async () => {
    const element = await navigateTo('/sessions/s-999');
    expect(element.textContent).toContain('Session not found');
  });

  describe('unsaved changes', () => {
    async function dirtyCreateForm() {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/sessions/new');

      const title =
        harness.routeNativeElement!.querySelector<HTMLInputElement>('input[name="title"]')!;
      title.value = 'Draft';
      title.dispatchEvent(new Event('input'));
      await harness.fixture.whenStable();
      return harness;
    }

    /**
     * Starts a navigation that the guard will hold open, and waits for its dialog. The
     * pending navigation is wrapped so that awaiting this helper does not await it too.
     */
    async function leaveTowards(harness: RouterTestingHarness, url: string) {
      const navigation = TestBed.inject(Router).navigateByUrl(url);
      await vi.waitFor(() => {
        expect(harness.fixture.nativeElement.querySelector('[role="alertdialog"]')).not.toBeNull();
      });
      return { navigation };
    }

    function answer(harness: RouterTestingHarness, label: string) {
      Array.from<HTMLButtonElement>(harness.fixture.nativeElement.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === label)!
        .click();
    }

    it('holds navigation until the user answers, then stays', async () => {
      const harness = await dirtyCreateForm();
      const { navigation } = await leaveTowards(harness, '/sessions');
      expect(TestBed.inject(Router).url).toBe('/sessions/new');

      answer(harness, 'Stay on page');
      await expect(navigation).resolves.toBe(false);
      expect(TestBed.inject(Router).url).toBe('/sessions/new');
    });

    it('leaves once the user discards', async () => {
      const harness = await dirtyCreateForm();
      const { navigation } = await leaveTowards(harness, '/sessions');

      answer(harness, 'Discard and leave');
      await expect(navigation).resolves.toBe(true);
      expect(TestBed.inject(Router).url).toBe('/sessions');
    });

    it('does not prompt when leaving an untouched form', async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/sessions/new');
      await harness.navigateByUrl('/sessions');

      expect(TestBed.inject(Router).url).toBe('/sessions');
    });
  });
});
