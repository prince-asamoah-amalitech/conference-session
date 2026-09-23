import { Signal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl } from '@angular/forms';
import { controlState } from './control-state';

describe('controlState', () => {
  let control: ReturnType<typeof signal<AbstractControl | null>>;
  let touched: Signal<boolean | undefined>;

  beforeEach(() => {
    control = signal<AbstractControl | null>(new FormControl(''));
    TestBed.runInInjectionContext(() => {
      const state = controlState(control);
      touched = computed(() => {
        state();
        return control()?.touched;
      });
    });
    // toObservable subscribes from an effect, so let it run before emitting events.
    TestBed.tick();
  });

  /** The trap the helper exists for: without it this computed would memoise `false`. */
  it('lets a computed see changes made on the control', () => {
    expect(touched()).toBe(false);

    control()!.markAsTouched();
    expect(touched()).toBe(true);
  });

  it('follows the control when the signal points at a new one', () => {
    const previous = control()!;
    const next = new FormControl('');
    control.set(next);
    TestBed.tick();

    next.markAsTouched();
    expect(touched()).toBe(true);

    next.markAsUntouched();
    previous.markAsTouched();
    expect(touched()).toBe(false);
  });

  it('tolerates a null control', () => {
    control.set(null);
    TestBed.tick();
    expect(touched()).toBeUndefined();
  });
});
