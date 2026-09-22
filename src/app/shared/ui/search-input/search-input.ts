import { Component, computed, input, output } from '@angular/core';

let nextId = 0;

/**
 * The design system splits SearchInput from InputField, and so does this: the search
 * box is driven by a plain value and is not part of a reactive form, so folding it into
 * UiInput would mean a dual-mode API for a single caller.
 */
@Component({
  imports: [],
  selector: 'app-ui-search-input',
  templateUrl: './search-input.html',
})
export class UiSearchInput {
  readonly label = input.required<string>();
  readonly value = input('');
  readonly placeholder = input('');
  readonly name = input('q');

  readonly valueChange = output<string>();

  protected readonly inputId = `ui-search-${nextId++}`;

  protected readonly hasLabel = computed(() => !!this.label());

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
