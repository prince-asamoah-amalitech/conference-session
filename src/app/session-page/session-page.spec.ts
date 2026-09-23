import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SessionPage } from './session-page';
import { SessionService } from './services/session';

describe('SessionPage', () => {
  let component: SessionPage;
  let fixture: ComponentFixture<SessionPage>;

  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll('tbody tr'));
  const hint = () => el().querySelector('.ui-hint')?.textContent?.replace(/\s+/g, ' ').trim();

  async function search(q: string | undefined) {
    fixture.componentRef.setInput('q', q);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionPage);
    fixture.componentRef.setInput('q', '');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists every session when no search term is set', async () => {
    const total = TestBed.inject(SessionService).count();
    expect(rows().length).toBe(total);
    expect(hint()).toBe(`${total} sessions`);
  });

  /** Regression: the router binds `undefined` for an absent query param. */
  it('treats an undefined term as no term', async () => {
    await search(undefined);
    expect(rows().length).toBe(TestBed.inject(SessionService).count());
  });

  it('filters the list by the q input', async () => {
    await search('postgres');
    expect(rows().length).toBe(1);
  });

  it('describes the filtered result, singular or plural', async () => {
    await search('postgres');
    expect(hint()).toBe('1 session matching “postgres”');

    await search('backend');
    expect(hint()).toBe('3 sessions matching “backend”');
  });

  it('shows the term in the search box', async () => {
    await search('postgres');
    expect(el().querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('postgres');
  });

  it('shows the empty state when nothing matches', async () => {
    await search('cobol');
    expect(hint()).toBe('0 sessions matching “cobol”');
    expect(el().textContent).toContain('No sessions found');
  });

  it('lists the most recently created session first', () => {
    const sessions = TestBed.inject(SessionService);
    const newest = [...sessions.all()].sort((a, b) => a.id.localeCompare(b.id)).at(-1)!;

    const firstRow = el().querySelector('tbody tr')!;
    expect(firstRow.textContent).toContain(newest.title);
  });

  it('keeps newest-first order within search results', async () => {
    await search('backend');
    expect(rows().map((row) => row.querySelector('a')?.getAttribute('href'))).toEqual([
      '/sessions/s-008',
      '/sessions/s-005',
      '/sessions/s-002',
    ]);
  });

  it('does not reorder the service data while sorting', () => {
    const sessions = TestBed.inject(SessionService);
    expect(sessions.all()[0].id).toBe('s-001');
  });

  it('puts a newly created session at the top', async () => {
    const sessions = TestBed.inject(SessionService);
    const created = sessions.create({
      title: 'Brand new session',
      track: 'frontend',
      startsAt: '2020-01-01T09:00:00.000Z',
      endsAt: '2020-01-01T10:00:00.000Z',
      capacity: 10,
      speakers: [{ name: 'A Speaker', email: 'a@example.com' }],
    });
    await fixture.whenStable();

    const firstRow = el().querySelector('tbody tr')!;
    expect(firstRow.textContent).toContain(created.title);
  });

  it('links to the create page', () => {
    const link = Array.from(el().querySelectorAll('a')).find((a) =>
      a.textContent?.includes('New session'),
    );
    expect(link?.getAttribute('href')).toBe('/sessions/new');
  });

  describe('typing a search term', () => {
    function typeSearch(value: string) {
      const input = el().querySelector<HTMLInputElement>('input[type="search"]')!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }

    it('writes the term to the URL without adding history', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      typeSearch('angular');

      expect(navigate).toHaveBeenCalledWith([], {
        queryParams: { q: 'angular' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    it('drops the param for a blank term so the URL stays clean', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      typeSearch('   ');

      expect(navigate).toHaveBeenCalledWith(
        [],
        expect.objectContaining({ queryParams: { q: null } }),
      );
    });
  });
});
