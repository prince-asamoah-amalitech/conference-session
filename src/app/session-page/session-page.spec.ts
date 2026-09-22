import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionPage } from './session-page';
import { SessionService } from './services/session';

describe('SessionPage', () => {
  let component: SessionPage;
  let fixture: ComponentFixture<SessionPage>;

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
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(total);
  });

  it('filters the list by the q input', async () => {
    fixture.componentRef.setInput('q', 'postgres');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('lists the most recently created session first', () => {
    const sessions = TestBed.inject(SessionService);
    const newest = [...sessions.all()].sort((a, b) => a.id.localeCompare(b.id)).at(-1)!;

    const firstRow = fixture.nativeElement.querySelector('tbody tr');
    expect(firstRow.textContent).toContain(newest.title);
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

    const firstRow = fixture.nativeElement.querySelector('tbody tr');
    expect(firstRow.textContent).toContain(created.title);

    sessions.remove(created.id);
  });
});
