import { Component, computed, input } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { controlState } from '../control-state';

/**
 * A single-choice segmented control backed by visually hidden radios, so arrow-key
 * navigation and screen-reader semantics come from the native inputs.
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-ui-segment-group',
  templateUrl: './segment-group.html',
})
export class UiSegmentGroup {
  readonly control = input.required<AbstractControl | null>();
  readonly options = input.required<readonly string[]>();
  readonly label = input.required<string>();

  private readonly state = controlState(this.control);

  protected readonly formControl = computed(() => this.control() as FormControl);
  protected readonly selected = computed(() => {
    this.state();
    return this.control()?.value;
  });
}
