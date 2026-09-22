import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionList } from './components/session-list/session-list';
import { SessionService } from './services/session';
import { Session } from './model/session.model';
import { ButtonDirective } from '../shared/ui/button/button';
import { UiSearchInput } from '../shared/ui/search-input/search-input';

/** The numeric part of an `s-NNN` id, which increases with each session created. */
function creationOrder(session: Session): number {
  const numeric = Number(session.id.replace(/\D/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
}

@Component({
  imports: [RouterLink, SessionList, ButtonDirective, UiSearchInput],
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

  /**
   * Newest first. Ids are issued in creation order (`s-001`, `s-002`, ...), so ordering
   * by their numeric part puts a session you have just created at the top of the list
   * rather than the bottom.
   *
   * The copy matters: `search()` hands back the service's own array when the term is
   * empty, and sorting in place would reorder the source of truth.
   */
  protected readonly results = computed(() =>
    [...this.sessions.search(this.q())].sort((a, b) => creationOrder(b) - creationOrder(a)),
  );

  protected onSearch(term: string): void {
    this.router.navigate([], {
      queryParams: { q: term.trim() ? term : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
