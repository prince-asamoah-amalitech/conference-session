import { Directive, input } from '@angular/core';

/** Button colour treatments, mapped to the `ui-btn-*` recipes in styles.css. */
export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'neutral';

export type ButtonSize = 'md' | 'sm';

/**
 * Applies the design system's button treatment to a native <button> or <a>.
 *
 * A directive rather than a component so that `type="submit"`, `disabled` and
 * `routerLink` keep their native behaviour instead of being re-exposed as inputs.
 *
 * Each recipe is bound individually rather than through a single `[class]` expression:
 * per-class bindings merge with whatever static classes the call site already carries
 * (spacing utilities, `w-full`), and Tailwind sees each name as a complete literal.
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    '[class.ui-btn]': 'true',
    '[class.ui-btn-primary]': 'variant() === "primary"',
    '[class.ui-btn-secondary]': 'variant() === "secondary"',
    '[class.ui-btn-ghost]': 'variant() === "ghost"',
    '[class.ui-btn-danger]': 'variant() === "danger"',
    '[class.ui-btn-danger-ghost]': 'variant() === "danger-ghost"',
    '[class.ui-btn-neutral]': 'variant() === "neutral"',
    '[class.ui-btn-sm]': 'size() === "sm"',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
}
