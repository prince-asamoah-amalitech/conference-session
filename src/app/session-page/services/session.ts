import { Injectable, computed, signal } from '@angular/core';
import { Session } from '../model/session.model';
import { sessionDataList } from '../data/session.data';

/** Fields a caller supplies when creating or editing a session. */
export type SessionDraft = Omit<Session, 'id'>;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessions = signal<Session[]>(sessionDataList);

  readonly all = this.sessions.asReadonly();
  readonly count = computed(() => this.sessions().length);

  /** Matches on title, track and speaker names; an empty term returns everything. */
  search(term: string | undefined): Session[] {
    const needle = (term ?? '').trim().toLowerCase();
    if (!needle) {
      return this.sessions();
    }

    return this.sessions().filter(
      (session) =>
        session.title.toLowerCase().includes(needle) ||
        session.track.toLowerCase().includes(needle) ||
        session.speakers.some(
          (speaker) =>
            speaker.name.toLowerCase().includes(needle) ||
            speaker.email.toLowerCase().includes(needle),
        ),
    );
  }

  getById(id: string): Session | undefined {
    return this.sessions().find((session) => session.id === id);
  }

  create(draft: SessionDraft): Session {
    const session: Session = { id: this.nextId(), ...draft };
    this.sessions.update((sessions) => [...sessions, session]);
    return session;
  }

  /** Replaces the editable fields of an existing session; returns false when the id is unknown. */
  update(id: string, draft: SessionDraft): boolean {
    if (!this.getById(id)) {
      return false;
    }

    this.sessions.update((sessions) =>
      sessions.map((session) => (session.id === id ? { id, ...draft } : session)),
    );
    return true;
  }

  remove(id: string): void {
    this.sessions.update((sessions) => sessions.filter((session) => session.id !== id));
  }

  private nextId(): string {
    const highest = this.sessions().reduce((max, session) => {
      const numeric = Number(session.id.replace(/\D/g, ''));
      return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 0);

    return `s-${String(highest + 1).padStart(3, '0')}`;
  }
}
