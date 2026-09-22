import { Component, inject } from '@angular/core';
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
  selector: 'app-create-session',
  styleUrl: './create-session.css',
  templateUrl: './create-session.html',
})
export class CreateSession extends SessionFormBase {
  private readonly sessions = inject(SessionService);
  private readonly router = inject(Router);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const created = this.sessions.create(this.toDraft());
    this.markSaved();
    this.router.navigate(['/sessions', created.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/sessions']);
  }
}
