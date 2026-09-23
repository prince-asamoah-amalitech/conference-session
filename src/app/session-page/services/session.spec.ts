import { TestBed } from '@angular/core/testing';
import { SessionService } from './session';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns every session for an empty search term', () => {
    expect(service.search('  ').length).toBe(service.count());
  });

  it('filters by title, track and speaker', () => {
    expect(service.search('signals').map((s) => s.id)).toEqual(['s-001']);
    expect(
      service.search('ai').every((s) => s.track === 'ai' || s.title.toLowerCase().includes('ai')),
    ).toBe(true);
    expect(service.search('kwame').map((s) => s.id)).toEqual(['s-002']);
  });

  it('creates a session with a generated id', () => {
    const before = service.count();
    const created = service.create({
      title: 'A new talk',
      track: 'frontend',
      startsAt: '2026-10-14T09:00:00.000Z',
      endsAt: '2026-10-14T10:00:00.000Z',
      capacity: 50,
      speakers: [{ name: 'Test Speaker', email: 'test@example.com' }],
    });

    expect(service.count()).toBe(before + 1);
    expect(service.getById(created.id)).toEqual(created);
  });

  it('updates an existing session and reports unknown ids', () => {
    const existing = service.all()[0];
    const updated = service.update(existing.id, { ...existing, title: 'Renamed' });

    expect(updated).toBe(true);
    expect(service.getById(existing.id)?.title).toBe('Renamed');
    expect(service.update('does-not-exist', { ...existing })).toBe(false);
  });
});
