import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
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
});
