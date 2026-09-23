import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CreateSession } from './create-session';
import { SessionService } from '../../services/session';
import { toIso } from '../session-form.base';

describe('CreateSession', () => {
  let component: CreateSession;
  let fixture: ComponentFixture<CreateSession>;
  let sessions: SessionService;
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

  async function fillValid() {
    await type(query('input[name="title"]')!, '  Zoneless Angular  ');
    queryAll<HTMLInputElement>('input[type="radio"]')[2].click();
    await type(query('input[name="startsAt"]')!, '2026-10-14T09:00');
    await type(query('input[name="endsAt"]')!, '2026-10-14T10:30');
    await type(query('input[name="capacity"]')!, '250');
    await type(query('input[name="name"]')!, 'Ama Boateng');
    await type(query('input[name="email"]')!, 'ama@example.com');
  }

  async function submit() {
    query('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSession],
      providers: [provideRouter([])],
    }).compileComponents();

    sessions = TestBed.inject(SessionService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(CreateSession);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders an empty form in create mode', () => {
    expect(query('h1')?.textContent).toContain('New session');
    expect(query<HTMLInputElement>('input[name="title"]')?.value).toBe('');
    expect(query<HTMLInputElement>('input[name="capacity"]')?.value).toBe('10');
    expect(queryAll('input[name="name"]')).toHaveLength(1);
  });

  it('allows navigation away while the form is untouched', () => {
    expect(component.canDeactivate()).toBe(true);
  });

  it('flags unsaved changes once the user edits a field', async () => {
    expect(el().textContent).not.toContain('Unsaved changes');

    await type(query('input[name="title"]')!, 'Draft');
    expect(el().textContent).toContain('Unsaved changes');
  });

  describe('speakers', () => {
    it('disables removing the only speaker', () => {
      expect(button('Remove').disabled).toBe(true);
    });

    it('adds and removes speaker rows', async () => {
      button('+ Add speaker').click();
      await fixture.whenStable();
      expect(queryAll('input[name="name"]')).toHaveLength(2);
      expect(queryAll<HTMLButtonElement>('button').filter((b) => b.disabled)).toHaveLength(0);

      button('Remove').click();
      await fixture.whenStable();
      expect(queryAll('input[name="name"]')).toHaveLength(1);
    });
  });

  describe('submitting an invalid form', () => {
    it('shows every error and creates nothing', async () => {
      const before = sessions.count();
      await submit();

      expect(sessions.count()).toBe(before);
      expect(navigate).not.toHaveBeenCalled();
      expect(el().textContent).toContain('A title of at most 120 characters is required.');
      expect(el().textContent).toContain('A start time is required.');
      expect(el().textContent).toContain('A speaker name is required.');
      expect(el().textContent).toContain('A valid email address is required.');
    });

    it('explains an end time before the start time', async () => {
      await fillValid();
      await type(query('input[name="endsAt"]')!, '2026-10-14T08:00');
      await submit();

      expect(navigate).not.toHaveBeenCalled();
      expect(el().textContent).toContain('The end time must come after the start time.');
    });

    it('rejects a capacity out of range', async () => {
      await fillValid();
      await type(query('input[name="capacity"]')!, '0');
      await submit();

      expect(navigate).not.toHaveBeenCalled();
      expect(el().textContent).toContain('Capacity must be a whole number between 1 and 10000.');
    });
  });

  describe('submitting a valid form', () => {
    it('creates the session from the trimmed form value', async () => {
      const create = vi.spyOn(sessions, 'create');
      await fillValid();
      await submit();

      expect(create).toHaveBeenCalledWith({
        title: 'Zoneless Angular',
        track: 'ai',
        startsAt: toIso('2026-10-14T09:00'),
        endsAt: toIso('2026-10-14T10:30'),
        capacity: 250,
        speakers: [{ name: 'Ama Boateng', email: 'ama@example.com' }],
      });
    });

    it('opens the new session and leaves without a prompt', async () => {
      await fillValid();
      await submit();

      const created = sessions.all().at(-1)!;
      expect(created.title).toBe('Zoneless Angular');
      expect(navigate).toHaveBeenCalledWith(['/sessions', created.id]);
      expect(component.canDeactivate()).toBe(true);
    });
  });

  it('returns to the list on cancel', async () => {
    button('Cancel').click();
    expect(navigate).toHaveBeenCalledWith(['/sessions']);
  });

  describe('leaving with unsaved changes', () => {
    beforeEach(async () => {
      await type(query('input[name="title"]')!, 'Draft');
    });

    it('opens the dialog and waits for an answer', async () => {
      const result = component.canDeactivate();
      await fixture.whenStable();

      expect(result).toBeInstanceOf(Promise);
      expect(query('[role="alertdialog"]')).not.toBeNull();
    });

    it('leaves when the user discards', async () => {
      const result = component.canDeactivate();
      await fixture.whenStable();

      button('Discard and leave').click();
      await expect(result).resolves.toBe(true);
    });

    it('stays when the user chooses to, and closes the dialog', async () => {
      const result = component.canDeactivate();
      await fixture.whenStable();

      button('Stay on page').click();
      await expect(result).resolves.toBe(false);

      await fixture.whenStable();
      expect(query('[role="alertdialog"]')).toBeNull();
    });

    it('stays when the user presses Escape', async () => {
      const result = component.canDeactivate();
      await fixture.whenStable();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await expect(result).resolves.toBe(false);
    });
  });
});
