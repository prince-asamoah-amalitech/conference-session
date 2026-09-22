import { Component, computed, effect, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionFormBase } from '../session-form.base';
import { SessionService } from '../../services/session';
import { SaveChangesDialog } from '../save-changes-dialog/save-changes-dialog';
import { ButtonDirective } from '../../../shared/ui/button/button';
import { UiInput } from '../../../shared/ui/input/input';
import { UiSegmentGroup } from '../../../shared/ui/segment-group/segment-group';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SaveChangesDialog,
    ButtonDirective,
    UiInput,
    UiSegmentGroup,
  ],
  selector: 'app-edit-session',
  styleUrl: './edit-session.css',
  templateUrl: './edit-session.html',
})
export class EditSession extends SessionFormBase {
  private readonly sessions = inject(SessionService);
  private readonly router = inject(Router);

  /** Bound from the ':id' route parameter by withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly session = computed(() => this.sessions.getById(this.id()));

  constructor() {
    super();

    effect(() => {
      const session = this.session();
      if (session) {
        this.patchFrom(session);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sessions.update(this.id(), this.toDraft());
    this.markSaved();
    this.router.navigate(['/sessions']);
  }

  protected cancel(): void {
    this.router.navigate(['/sessions']);
  }
}
