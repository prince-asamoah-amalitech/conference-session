import { Component, computed, input } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { controlState } from '../control-state';

export type UiInputType = 'text' | 'email' | 'number' | 'datetime-local';

let nextId = 0;

/**
 * A labelled form control: label, native input, and the error or hint beneath it.
 *
 * Takes the control itself rather than implementing ControlValueAccessor, so the
 * component can decide when to show its error without the caller repeating the rule.
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-ui-input',
  templateUrl: './input.html',
})
export class UiInput {
  readonly control = input.required<AbstractControl | null>();
  /** Rendered on the native input; also the handle tests and autofill use. */
  readonly name = input.required<string>();
  readonly label = input<string>();
  readonly type = input<UiInputType>('text');
  readonly placeholder = input('');
  /** Shown once the control is invalid and the user has interacted with it. */
  readonly errorText = input<string>();
  readonly hint = input<string>();
  readonly min = input<number>();
  readonly max = input<number>();

  private readonly uid = `ui-input-${nextId++}`;
  private readonly state = controlState(this.control);

  protected readonly formControl = computed(() => this.control() as FormControl);
  protected readonly inputId = computed(() => `${this.uid}-${this.name()}`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly hintId = computed(() => `${this.inputId()}-hint`);

  /** Matches the rule the forms used before this component existed. */
  protected readonly invalid = computed(() => {
    this.state();
    const control = this.control();
    return !!control && control.invalid && (control.touched || control.dirty);
  });

  protected readonly showError = computed(() => this.invalid() && !!this.errorText());

  protected readonly describedBy = computed(() => {
    if (this.showError()) {
      return this.errorId();
    }
    return this.hint() ? this.hintId() : null;
  });
}
