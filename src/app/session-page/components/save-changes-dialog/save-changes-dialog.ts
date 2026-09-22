import {
  Component,
  ElementRef,
  HostListener,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ButtonDirective } from '../../../shared/ui/button/button';

@Component({
  imports: [ButtonDirective],
  selector: 'app-save-changes-dialog',
  styleUrl: './save-changes-dialog.css',
  templateUrl: './save-changes-dialog.html',
})
export class SaveChangesDialog {
  readonly open = input(false);
  readonly message = input('You have unsaved changes. Save them before leaving the page.');

  /** Emits true when the user chooses to leave, false when they stay. */
  readonly decision = output<boolean>();

  private readonly stayButton = viewChild<ElementRef<HTMLButtonElement>>('stayButton');

  constructor() {
    // Opening moves focus onto the non-destructive action, as the design's
    // keyboard flow expects.
    effect(() => {
      if (this.open()) {
        this.stayButton()?.nativeElement.focus();
      }
    });
  }

  /** Esc dismisses the dialog the same way the design system's modal does. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.stay();
    }
  }

  protected stay(): void {
    this.decision.emit(false);
  }

  protected leave(): void {
    this.decision.emit(true);
  }
}
