import { ComponentFixture, TestBed } from '@angular/core/testing';
import { formatDate } from '@angular/common';
import { Router, provideRouter } from '@angular/router';
import { SessionList } from './session-list';
import { sessionDataList } from '../../data/session.data';

describe('SessionList', () => {
  let component: SessionList;
  let fixture: ComponentFixture<SessionList>;

  const rows = (): HTMLTableRowElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionList);
    fixture.componentRef.setInput('sessions', sessionDataList.slice(0, 3));
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one row per session, in the order given', () => {
    expect(rows()).toHaveLength(3);
    expect(rows().map((row) => row.querySelector('a')?.textContent?.trim())).toEqual(
      sessionDataList.slice(0, 3).map((s) => s.title),
    );
  });

  it('shows the speakers, track, time and capacity of each session', () => {
    const [session] = sessionDataList;
    const text = rows()[0].textContent!;

    expect(text).toContain('Ama Boateng, Lukas Weber');
    expect(text).toContain(session.track);
    expect(text).toContain(formatDate(session.startsAt, 'EEE d MMM', 'en-US'));
    expect(text).toContain(formatDate(session.startsAt, 'HH:mm', 'en-US'));
    expect(text).toContain(formatDate(session.endsAt, 'HH:mm', 'en-US'));
    expect(text).toContain(String(session.capacity));
  });

  it.each([
    [0, 'ui-badge-blue'],
    [1, 'ui-badge-green'],
    [2, 'ui-badge-purple'],
  ])('colours the track badge of row %i with %s', (index, badge) => {
    expect(rows()[index].querySelector('.ui-badge')?.classList).toContain(badge);
  });

  it('links each title to its edit page', () => {
    expect(rows()[1].querySelector('a')?.getAttribute('href')).toBe('/sessions/s-002');
  });

  it('opens the session when the row is clicked', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    rows()[2]
      .querySelector('td:last-child')!
      .dispatchEvent(new Event('click', { bubbles: true }));

    expect(navigate).toHaveBeenCalledWith(['/sessions', 's-003']);
  });

  it('does not double-navigate when the title link is clicked', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    rows()[0].querySelector('a')!.click();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows an empty state instead of a table when there are no sessions', async () => {
    fixture.componentRef.setInput('sessions', []);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No sessions found');
  });
});
