import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionList } from './components/session-list/session-list';
import { SessionService } from './services/session';

@Component({
  imports: [RouterLink, SessionList],
  selector: 'app-session-page',
  styleUrl: './session-page.css',
  templateUrl: './session-page.html',
})
export class SessionPage {
  private readonly sessions = inject(SessionService);
  private readonly router = inject(Router);

  /**
   * The search term, bound from the 'q' query parameter by withComponentInputBinding().
   * Keeping it in the URL is what makes the term survive a refresh and the result shareable.
   * The transform matters: the router binds `undefined` when the param is absent, which
   * would otherwise shadow the default value.
   */
  readonly q = input('', { transform: (value: string | undefined) => value ?? '' });

  protected readonly results = computed(() => this.sessions.search(this.q()));

  protected onSearch(term: string): void {
    this.router.navigate([], {
      queryParams: { q: term.trim() ? term : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
