import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionDraft, SessionService } from './session';
import { Session } from '../model/session.model';
import { sessionDataList } from '../data/session.data';

function draft(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    title: 'A new talk',
    track: 'frontend',
    startsAt: '2026-10-14T09:00:00.000Z',
    endsAt: '2026-10-14T10:00:00.000Z',
    capacity: 50,
    speakers: [{ name: 'Test Speaker', email: 'test@example.com' }],
    ...overrides,
  };
}

function ids(sessions: Session[]): string[] {
  return sessions.map((session) => session.id);
}

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('is a root singleton', () => {
    expect(TestBed.inject(SessionService)).toBe(service);
  });

  describe('seed data', () => {
    it('starts with the seed sessions in order', () => {
      expect(service.all()).toEqual(sessionDataList);
      expect(service.count()).toBe(sessionDataList.length);
    });

    it('exposes all as a readonly signal', () => {
      expect('set' in service.all).toBe(false);
      expect('update' in service.all).toBe(false);
    });

    /**
     * Tests run with `isolate: false`, so the seed module is shared across spec files.
     * Mutating it in place would leak state from one test into the next.
     */
    it('never mutates the seed array', () => {
      const snapshot = structuredClone(sessionDataList);

      const created = service.create(draft());
      service.update(sessionDataList[0].id, draft({ title: 'Renamed' }));
      service.remove(sessionDataList[1].id);
      service.remove(created.id);

      expect(sessionDataList).toEqual(snapshot);
    });
  });

  describe('search', () => {
    it.each([undefined, '', '   '])('returns every session for %j', (term) => {
      expect(service.search(term)).toEqual(service.all());
    });

    it('matches on title', () => {
      expect(ids(service.search('signals'))).toEqual(['s-001']);
    });

    it('matches on track', () => {
      expect(ids(service.search('backend'))).toEqual(['s-002', 's-005', 's-008']);
    });

    it('matches on speaker name', () => {
      expect(ids(service.search('kwame'))).toEqual(['s-002']);
    });

    it('matches on speaker email', () => {
      expect(ids(service.search('grace.osei@'))).toEqual(['s-005']);
    });

    it('matches any speaker, not just the first', () => {
      expect(ids(service.search('lukas weber'))).toEqual(['s-001']);
    });

    it('matches a substring anywhere in a field', () => {
      // "Container" contains "ai", so s-004 matches alongside the ai track.
      expect(ids(service.search('ai'))).toEqual(['s-003', 's-004', 's-006', 's-009']);
    });

    it('ignores case and surrounding whitespace', () => {
      expect(ids(service.search('  POSTGRES  '))).toEqual(['s-008']);
    });

    it('returns an empty list when nothing matches', () => {
      expect(service.search('cobol')).toEqual([]);
    });

    it('does not match on fields outside title, track and speakers', () => {
      expect(service.search('s-001')).toEqual([]);
      expect(service.search('120')).toEqual([]);
    });

    it('includes sessions created after the service started', () => {
      const created = service.create(draft({ title: 'Zoneless Angular' }));
      expect(service.search('zoneless')).toEqual([created]);
    });
  });

  describe('getById', () => {
    it('returns the matching session', () => {
      expect(service.getById('s-003')?.title).toBe(
        'Retrieval-Augmented Generation Beyond the Demo',
      );
    });

    it('returns undefined for an unknown id', () => {
      expect(service.getById('s-999')).toBeUndefined();
      expect(service.getById('')).toBeUndefined();
    });
  });

  describe('create', () => {
    it('returns the new session with a generated id and the draft fields', () => {
      const input = draft();
      const created = service.create(input);

      expect(created).toEqual({ id: 's-011', ...input });
    });

    it('appends the session and bumps the count', () => {
      const created = service.create(draft());

      expect(service.count()).toBe(sessionDataList.length + 1);
      expect(service.all().at(-1)).toBe(created);
      expect(service.getById(created.id)).toBe(created);
    });

    it('issues sequential, zero-padded ids', () => {
      expect(ids([service.create(draft()), service.create(draft())])).toEqual(['s-011', 's-012']);
    });

    it('widens the id past three digits instead of truncating', () => {
      let last: Session | undefined;
      for (let i = 0; i < 990; i++) {
        last = service.create(draft());
      }
      expect(last?.id).toBe('s-1000');
    });

    it('continues from the highest id even when lower ids have been removed', () => {
      service.remove('s-001');
      expect(service.create(draft()).id).toBe('s-011');
    });

    it('keeps the generated id when the draft carries a stray id', () => {
      const stray = { ...draft(), id: 's-001' } as SessionDraft;
      const created = service.create(stray);

      expect(created.id).toBe('s-011');
      expect(ids(service.all()).filter((id) => id === 's-001')).toHaveLength(1);
    });

    it('replaces the array rather than mutating it', () => {
      const before = service.all();
      service.create(draft());

      expect(service.all()).not.toBe(before);
      expect(before).toHaveLength(sessionDataList.length);
    });
  });

  describe('update', () => {
    it('replaces the editable fields and reports success', () => {
      const changes = draft({ title: 'Renamed', track: 'ai', capacity: 999 });

      expect(service.update('s-002', changes)).toBe(true);
      expect(service.getById('s-002')).toEqual({ id: 's-002', ...changes });
    });

    it('keeps the session in place and leaves the others untouched', () => {
      const before = service.all();
      service.update('s-002', draft({ title: 'Renamed' }));

      expect(ids(service.all())).toEqual(ids(before));
      for (const session of service.all().filter((s) => s.id !== 's-002')) {
        expect(before).toContain(session);
      }
    });

    it('keeps the target id when the draft carries a stray id', () => {
      const other = service.getById('s-001')!;
      service.update('s-002', { ...other, title: 'Copied' });

      expect(service.getById('s-002')?.title).toBe('Copied');
      expect(service.getById('s-001')?.title).toBe(other.title);
    });

    it('reports an unknown id and changes nothing', () => {
      const before = service.all();

      expect(service.update('does-not-exist', draft())).toBe(false);
      expect(service.all()).toBe(before);
    });
  });

  describe('remove', () => {
    it('deletes the session', () => {
      service.remove('s-004');

      expect(service.getById('s-004')).toBeUndefined();
      expect(service.count()).toBe(sessionDataList.length - 1);
      expect(ids(service.all())).not.toContain('s-004');
    });

    it('ignores an unknown id', () => {
      service.remove('does-not-exist');
      expect(service.all()).toEqual(sessionDataList);
    });
  });

  describe('reactivity', () => {
    it('notifies computeds that read all and count', () => {
      const titles = computed(() => service.all().map((session) => session.title));
      const count = computed(() => service.count());
      expect(count()).toBe(sessionDataList.length);

      service.create(draft({ title: 'Reactive talk' }));
      expect(count()).toBe(sessionDataList.length + 1);
      expect(titles()).toContain('Reactive talk');

      service.remove('s-001');
      expect(count()).toBe(sessionDataList.length);
    });

    it('notifies computeds that call search', () => {
      const matches = computed(() => service.search('backend').length);
      expect(matches()).toBe(3);

      service.create(draft({ track: 'backend' }));
      expect(matches()).toBe(4);
    });
  });
});
