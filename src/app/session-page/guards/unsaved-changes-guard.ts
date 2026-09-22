import { CanDeactivateFn } from '@angular/router';

/** Implemented by any routed component that can hold unsaved edits. */
export interface CanComponentDeactivate {
  canDeactivate(): boolean | Promise<boolean>;
}

/**
 * Lets a component veto navigation. Components with a dirty form return a promise that
 * settles once the user answers the SaveChangesDialog.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) =>
  component.canDeactivate();
