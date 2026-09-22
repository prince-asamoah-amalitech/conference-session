import { inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Session, Speaker } from '../model/session.model';
import { SessionDraft } from '../services/session';
import { CanComponentDeactivate } from '../guards/unsaved-changes-guard';

export const TRACKS = ['frontend', 'backend', 'ai'] as const;
export type Track = (typeof TRACKS)[number];

/** Rejects a session whose end is not strictly after its start. */
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const startsAt = group.get('startsAt')?.value;
  const endsAt = group.get('endsAt')?.value;

  if (!startsAt || !endsAt) {
    return null;
  }

  return new Date(endsAt) > new Date(startsAt) ? null : { endBeforeStart: true };
}

/**
 * Shared state for the create and edit session forms: the reactive form itself, the
 * speakers FormArray, and the unsaved-changes prompt the router guard waits on.
 */
export abstract class SessionFormBase implements CanComponentDeactivate {
  protected readonly formBuilder = inject(FormBuilder);

  protected readonly tracks = TRACKS;

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(120)]],
      track: ['frontend' as Track, Validators.required],
      startsAt: ['', Validators.required],
      endsAt: ['', Validators.required],
      capacity: [10, [Validators.required, Validators.min(1), Validators.max(10000)]],
      speakers: this.formBuilder.array([this.createSpeaker()], Validators.required),
    },
    { validators: endAfterStart },
  );

  /** Drives the SaveChangesDialog; resolved by the user's answer. */
  protected readonly showSaveChangesDialog = signal(false);
  private pendingNavigation?: (leave: boolean) => void;

  /** True once a control has been interacted with and is failing validation. */
  protected isInvalid(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected get speakers(): FormArray {
    return this.form.controls.speakers;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.form.dirty) {
      return true;
    }

    this.showSaveChangesDialog.set(true);
    return new Promise<boolean>((resolve) => {
      this.pendingNavigation = resolve;
    });
  }

  protected onSaveChangesDecision(leave: boolean): void {
    this.showSaveChangesDialog.set(false);
    this.pendingNavigation?.(leave);
    this.pendingNavigation = undefined;
  }

  protected addSpeaker(speaker?: Speaker): void {
    this.speakers.push(this.createSpeaker(speaker));
    this.speakers.markAsDirty();
  }

  protected removeSpeaker(index: number): void {
    this.speakers.removeAt(index);
    this.speakers.markAsDirty();
  }

  /** True once the form has been submitted successfully, so the guard lets navigation through. */
  protected markSaved(): void {
    this.form.markAsPristine();
  }

  /** Fills the form from an existing session and resets it to pristine. */
  protected patchFrom(session: Session): void {
    this.speakers.clear();
    for (const speaker of session.speakers) {
      this.speakers.push(this.createSpeaker(speaker));
    }

    this.form.reset({
      title: session.title,
      track: session.track,
      startsAt: toLocalInput(session.startsAt),
      endsAt: toLocalInput(session.endsAt),
      capacity: session.capacity,
      speakers: session.speakers,
    });
  }

  /** The current form value as a session draft, with times back in ISO form. */
  protected toDraft(): SessionDraft {
    const value = this.form.getRawValue();

    return {
      title: value.title.trim(),
      track: value.track,
      startsAt: toIso(value.startsAt),
      endsAt: toIso(value.endsAt),
      capacity: Number(value.capacity),
      speakers: (value.speakers as Speaker[]).map((speaker) => ({
        name: speaker.name.trim(),
        email: speaker.email.trim(),
      })),
    };
  }

  private createSpeaker(speaker?: Speaker) {
    return this.formBuilder.nonNullable.group({
      name: [speaker?.name ?? '', [Validators.required, Validators.maxLength(80)]],
      email: [speaker?.email ?? '', [Validators.required, Validators.email]],
    });
  }
}

/** ISO string -> the 'YYYY-MM-DDTHH:mm' value a datetime-local input expects. */
export function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** datetime-local value -> ISO string. */
export function toIso(localValue: string): string {
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}
