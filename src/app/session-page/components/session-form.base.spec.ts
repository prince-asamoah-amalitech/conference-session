import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionFormBase, toIso, toLocalInput } from './session-form.base';
import { Session, Speaker } from '../model/session.model';

/** Exposes the protected surface of the base so it can be driven without a template. */
@Injectable()
class TestForm extends SessionFormBase {
  readonly exposedForm = this.form;
  readonly dialogOpen = this.showSaveChangesDialog;

  get speakerArray() {
    return this.speakers;
  }

  invalid = (path: string) => this.isInvalid(this.form.get(path));
  add = (speaker?: Speaker) => this.addSpeaker(speaker);
  remove = (index: number) => this.removeSpeaker(index);
  decide = (leave: boolean) => this.onSaveChangesDecision(leave);
  saved = () => this.markSaved();
  patch = (session: Session) => this.patchFrom(session);
  draft = () => this.toDraft();
}

const session: Session = {
  id: 's-042',
  title: 'Signals Deep Dive',
  track: 'backend',
  startsAt: '2026-10-12T09:00:00.000Z',
  endsAt: '2026-10-12T10:30:00.000Z',
  capacity: 75,
  speakers: [
    { name: 'Ama Boateng', email: 'ama@example.com' },
    { name: 'Kwame Mensah', email: 'kwame@example.com' },
  ],
};

describe('SessionFormBase', () => {
  let form: TestForm;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TestForm] });
    form = TestBed.inject(TestForm);
  });

  /** Fills every field with valid values, leaving the form ready to submit. */
  function fillValid() {
    form.patch(session);
  }

  describe('initial state', () => {
    it('starts empty, pristine and with one blank speaker', () => {
      const value = form.exposedForm.getRawValue();

      expect(value).toEqual({
        title: '',
        track: 'frontend',
        startsAt: '',
        endsAt: '',
        capacity: 10,
        speakers: [{ name: '', email: '' }],
      });
      expect(form.exposedForm.pristine).toBe(true);
      expect(form.exposedForm.invalid).toBe(true);
    });

    it('lets navigation through while pristine', () => {
      expect(form.canDeactivate()).toBe(true);
      expect(form.dialogOpen()).toBe(false);
    });
  });

  describe('validation', () => {
    beforeEach(fillValid);

    it('accepts a fully filled form', () => {
      expect(form.exposedForm.valid).toBe(true);
    });

    describe('title', () => {
      it('is required', () => {
        form.exposedForm.controls.title.setValue('');
        expect(form.exposedForm.controls.title.hasError('required')).toBe(true);
      });

      it('allows 120 characters but not 121', () => {
        const title = form.exposedForm.controls.title;

        title.setValue('x'.repeat(120));
        expect(title.valid).toBe(true);

        title.setValue('x'.repeat(121));
        expect(title.hasError('maxlength')).toBe(true);
      });
    });

    describe('capacity', () => {
      it.each([
        [0, 'min'],
        [-5, 'min'],
        [10001, 'max'],
      ])('rejects %d', (value, error) => {
        const capacity = form.exposedForm.controls.capacity;
        capacity.setValue(value);
        expect(capacity.hasError(error)).toBe(true);
      });

      it.each([1, 500, 10000])('accepts %d', (value) => {
        const capacity = form.exposedForm.controls.capacity;
        capacity.setValue(value);
        expect(capacity.valid).toBe(true);
      });

      it('is required', () => {
        const capacity = form.exposedForm.controls.capacity;
        capacity.setValue(null as unknown as number);
        expect(capacity.hasError('required')).toBe(true);
      });
    });

    describe('times', () => {
      it.each(['startsAt', 'endsAt'] as const)('requires %s', (field) => {
        form.exposedForm.controls[field].setValue('');
        expect(form.exposedForm.controls[field].hasError('required')).toBe(true);
      });

      it('rejects an end before the start', () => {
        form.exposedForm.patchValue({ startsAt: '2026-10-12T10:00', endsAt: '2026-10-12T09:00' });
        expect(form.exposedForm.hasError('endBeforeStart')).toBe(true);
      });

      it('rejects an end equal to the start', () => {
        form.exposedForm.patchValue({ startsAt: '2026-10-12T10:00', endsAt: '2026-10-12T10:00' });
        expect(form.exposedForm.hasError('endBeforeStart')).toBe(true);
      });

      it('accepts an end one minute after the start', () => {
        form.exposedForm.patchValue({ startsAt: '2026-10-12T10:00', endsAt: '2026-10-12T10:01' });
        expect(form.exposedForm.hasError('endBeforeStart')).toBe(false);
      });

      it('leaves the ordering check to required while either time is missing', () => {
        form.exposedForm.patchValue({ startsAt: '2026-10-12T10:00', endsAt: '' });
        expect(form.exposedForm.hasError('endBeforeStart')).toBe(false);
      });
    });

    describe('speakers', () => {
      it('requires at least one speaker', () => {
        form.speakerArray.clear();
        expect(form.speakerArray.hasError('required')).toBe(true);
        expect(form.exposedForm.invalid).toBe(true);
      });

      it('requires a name of at most 80 characters', () => {
        const name = form.speakerArray.at(0).get('name')!;

        name.setValue('');
        expect(name.hasError('required')).toBe(true);

        name.setValue('x'.repeat(80));
        expect(name.valid).toBe(true);

        name.setValue('x'.repeat(81));
        expect(name.hasError('maxlength')).toBe(true);
      });

      it.each(['', 'not-an-email', 'a@'])('rejects the email %j', (value) => {
        const email = form.speakerArray.at(0).get('email')!;
        email.setValue(value);
        expect(email.invalid).toBe(true);
      });

      it('invalidates the whole form when any speaker is invalid', () => {
        form.add();
        expect(form.exposedForm.invalid).toBe(true);
      });
    });
  });

  describe('isInvalid', () => {
    it('stays quiet until the control is touched or dirty', () => {
      expect(form.exposedForm.controls.title.invalid).toBe(true);
      expect(form.invalid('title')).toBe(false);

      form.exposedForm.controls.title.markAsTouched();
      expect(form.invalid('title')).toBe(true);
    });

    it('reports a dirty invalid control', () => {
      form.exposedForm.controls.title.markAsDirty();
      expect(form.invalid('title')).toBe(true);
    });

    it('is false for a touched valid control and for a missing one', () => {
      fillValid();
      form.exposedForm.controls.title.markAsTouched();

      expect(form.invalid('title')).toBe(false);
      expect(form.invalid('no-such-control')).toBe(false);
    });
  });

  describe('speakers array', () => {
    it('adds a blank speaker and marks the form dirty', () => {
      form.add();

      expect(form.speakerArray.length).toBe(2);
      expect(form.speakerArray.at(1).value).toEqual({ name: '', email: '' });
      expect(form.exposedForm.dirty).toBe(true);
    });

    it('adds a prefilled speaker', () => {
      form.add({ name: 'Grace', email: 'grace@example.com' });
      expect(form.speakerArray.at(1).value).toEqual({ name: 'Grace', email: 'grace@example.com' });
    });

    it('removes the speaker at an index and marks the form dirty', () => {
      fillValid();
      form.remove(0);

      expect(form.speakerArray.getRawValue()).toEqual([session.speakers[1]]);
      expect(form.exposedForm.dirty).toBe(true);
    });
  });

  describe('patchFrom', () => {
    it('fills every field, converting times for a datetime-local input', () => {
      fillValid();

      expect(form.exposedForm.getRawValue()).toEqual({
        title: session.title,
        track: session.track,
        startsAt: toLocalInput(session.startsAt),
        endsAt: toLocalInput(session.endsAt),
        capacity: session.capacity,
        speakers: session.speakers,
      });
    });

    it('replaces the speaker rows rather than appending to them', () => {
      form.add();
      fillValid();
      expect(form.speakerArray.length).toBe(session.speakers.length);
    });

    it('leaves the form pristine and untouched', () => {
      form.exposedForm.markAsDirty();
      form.exposedForm.markAllAsTouched();
      fillValid();

      expect(form.exposedForm.pristine).toBe(true);
      expect(form.exposedForm.touched).toBe(false);
      expect(form.canDeactivate()).toBe(true);
    });
  });

  describe('toDraft', () => {
    it('round-trips a session unchanged', () => {
      fillValid();
      const { id, ...expected } = session;
      expect(form.draft()).toEqual(expected);
    });

    it('trims text fields and coerces capacity to a number', () => {
      fillValid();
      form.exposedForm.patchValue({
        title: '  Padded  ',
        capacity: '42' as unknown as number,
        speakers: [
          { name: '  Ama ', email: ' ama@example.com ' },
          { name: 'Kwame', email: 'kwame@example.com' },
        ],
      });

      const draft = form.draft();
      expect(draft.title).toBe('Padded');
      expect(draft.capacity).toBe(42);
      expect(draft.speakers[0]).toEqual({ name: 'Ama', email: 'ama@example.com' });
    });
  });

  describe('unsaved-changes prompt', () => {
    beforeEach(() => form.exposedForm.markAsDirty());

    it('opens the dialog and waits while the form is dirty', () => {
      const result = form.canDeactivate();

      expect(result).toBeInstanceOf(Promise);
      expect(form.dialogOpen()).toBe(true);
    });

    it.each([true, false])('resolves with the decision %s and closes the dialog', async (leave) => {
      const result = form.canDeactivate();
      form.decide(leave);

      await expect(result).resolves.toBe(leave);
      expect(form.dialogOpen()).toBe(false);
    });

    it('ignores a decision when nothing is waiting', () => {
      expect(() => form.decide(true)).not.toThrow();
      expect(form.dialogOpen()).toBe(false);
    });

    it('lets navigation through once the form is marked saved', () => {
      form.saved();
      expect(form.canDeactivate()).toBe(true);
    });
  });
});

describe('toLocalInput', () => {
  it('formats an ISO string as local YYYY-MM-DDTHH:mm', () => {
    const iso = '2026-10-12T09:05:00.000Z';
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expected =
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

    expect(toLocalInput(iso)).toBe(expected);
  });

  it.each(['', 'not a date'])('returns an empty string for %j', (value) => {
    expect(toLocalInput(value)).toBe('');
  });
});

describe('toIso', () => {
  it('reverses toLocalInput', () => {
    const iso = '2026-10-12T09:05:00.000Z';
    expect(toIso(toLocalInput(iso))).toBe(iso);
  });

  it('reads the value as local time', () => {
    expect(toIso('2026-10-12T09:05')).toBe(new Date(2026, 9, 12, 9, 5).toISOString());
  });

  it.each(['', 'not a date'])('returns an empty string for %j', (value) => {
    expect(toIso(value)).toBe('');
  });
});
