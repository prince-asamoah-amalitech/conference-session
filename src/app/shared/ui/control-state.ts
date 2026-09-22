import { Signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { EMPTY, switchMap } from 'rxjs';

/**
 * Makes a reactive form control readable from a `computed()`.
 *
 * The app runs zoneless, and an AbstractControl is not a signal: a computed that read
 * `control.value` or `control.touched` directly would memoise the first result and
 * never update. This tracks the control's own event stream so that anything derived
 * from it recomputes when the control changes, without depending on some other
 * directive happening to trigger change detection.
 *
 * Call it from a field initialiser, where an injection context is available.
 */
export function controlState(control: Signal<AbstractControl | null>): Signal<unknown> {
  return toSignal(
    toObservable(control).pipe(switchMap((candidate) => candidate?.events ?? EMPTY)),
    { initialValue: null },
  );
}
