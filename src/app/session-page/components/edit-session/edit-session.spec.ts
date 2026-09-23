import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EditSession } from './edit-session';
import { SessionService } from '../../services/session';
import { toLocalInput } from '../session-form.base';
import { Session } from '../../model/session.model';

describe('EditSession', () => {
  let component: EditSession;
  let fixture: ComponentFixture<EditSession>;
  let sessions: SessionService;
  let session: Session;
  let navigate: ReturnType<typeof vi.spyOn>;

  const el = () => fixture.nativeElement as HTMLElement;
  const query = <T extends Element>(selector: string) => el().querySelector<T>(selector);
  const queryAll = <T extends Element>(selector: string) =>
    Array.from(el().querySelectorAll<T>(selector));
  const button = (label: string) =>
    queryAll<HTMLButtonElement>('button').find((b) => b.textContent?.trim() === label)!;

  async function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function submit() {
    query('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  async function open(id: string) {
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSession],
      providers: [provideRouter([])],
    }).compileComponents();

    sessions = TestBed.inject(SessionService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    session = sessions.getById('s-001')!;

    fixture = TestBed.createComponent(EditSession);
    component = fixture.componentInstance;
    await open(session.id);
  });

  it('populates the form from the session', () => {
    expect(query('h1')?.textContent).toContain('Edit session');
    expect(query<HTMLInputElement>('input[name="title"]')?.value).toBe(session.title);
    expect(query<HTMLInputElement>('input[name="startsAt"]')?.value).toBe(
      toLocalInput(session.startsAt),
    );
    expect(query<HTMLInputElement>('input[name="endsAt"]')?.value).toBe(
      toLocalInput(session.endsAt),
    );
    expect(query<HTMLInputElement>('input[name="capacity"]')?.value).toBe(String(session.capacity));
    expect(queryAll<HTMLInputElement>('input[name="email"]').map((i) => i.value)).toEqual(
      session.speakers.map((s) => s.email),
    );
    expect(query('.ui-segment-active')?.textContent?.trim()).toBe(session.track);
  });

  it('allows navigation away while the form is untouched', () => {
    expect(component.canDeactivate()).toBe(true);
    expect(el().textContent).not.toContain('Unsaved changes');
  });

  it('reloads the form when the id changes', async () => {
    const other = sessions.getById('s-002')!;
    await open(other.id);

    expect(query<HTMLInputElement>('input[name="title"]')?.value).toBe(other.title);
    expect(queryAll('input[name="name"]')).toHaveLength(other.speakers.length);
  });

  it('shows a not-found state for an unknown id', async () => {
    await open('s-999');

    expect(query('h1')?.textContent).toContain('Session not found');
    expect(el().textContent).toContain('s-999');
    expect(query('form')).toBeNull();
    expect(component.canDeactivate()).toBe(true);
  });

  it('saves the edit and returns to the list', async () => {
    await type(query('input[name="title"]')!, 'Signals, Revisited');
    await submit();

    expect(sessions.getById(session.id)).toEqual({ ...session, title: 'Signals, Revisited' });
    expect(navigate).toHaveBeenCalledWith(['/sessions']);
    expect(component.canDeactivate()).toBe(true);
  });

  it('saves removed speakers', async () => {
    button('Remove').click();
    await fixture.whenStable();
    await submit();

    expect(sessions.getById(session.id)?.speakers).toEqual([session.speakers[1]]);
  });

  it('refuses to save an invalid edit', async () => {
    const update = vi.spyOn(sessions, 'update');
    await type(query('input[name="title"]')!, '');
    await submit();

    expect(update).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(el().textContent).toContain('A title of at most 120 characters is required.');
  });

  it('prompts before leaving with unsaved changes', async () => {
    await type(query('input[name="capacity"]')!, '99');
    expect(el().textContent).toContain('Unsaved changes');

    const result = component.canDeactivate();
    await fixture.whenStable();
    expect(query('[role="alertdialog"]')).not.toBeNull();

    button('Discard and leave').click();
    await expect(result).resolves.toBe(true);
    expect(sessions.getById(session.id)?.capacity).toBe(session.capacity);
  });

  it('returns to the list on cancel without saving', async () => {
    await type(query('input[name="title"]')!, 'Unsaved');
    button('Cancel').click();

    expect(navigate).toHaveBeenCalledWith(['/sessions']);
    expect(sessions.getById(session.id)?.title).toBe(session.title);
  });
});
