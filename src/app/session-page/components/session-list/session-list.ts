import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../../model/session.model';

const TRACK_BADGES: Record<Session['track'], string> = {
  frontend: 'ui-badge-blue',
  backend: 'ui-badge-green',
  ai: 'ui-badge-purple',
};

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-session-list',
  styleUrl: './session-list.css',
  templateUrl: './session-list.html',
})
export class SessionList {
  private readonly router = inject(Router);

  readonly sessions = input.required<Session[]>();

  protected speakerNames(session: Session): string {
    return session.speakers.map((speaker) => speaker.name).join(', ');
  }

  protected trackBadgeClass(track: Session['track']): string {
    return TRACK_BADGES[track] ?? 'ui-badge-navy';
  }

  /** The whole row is clickable; the title cell keeps a real link for keyboard users. */
  protected open(session: Session): void {
    this.router.navigate(['/sessions', session.id]);
  }
}
