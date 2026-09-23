import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CanComponentDeactivate, unsavedChangesGuard } from './unsaved-changes-guard';

describe('unsavedChangesGuard', () => {
  function runGuard(component: CanComponentDeactivate) {
    return TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  }

  it.each([true, false])('passes a synchronous %s straight through', (answer) => {
    const component = { canDeactivate: vi.fn(() => answer) };

    expect(runGuard(component)).toBe(answer);
    expect(component.canDeactivate).toHaveBeenCalledOnce();
  });

  it('returns the pending promise so the router waits on the dialog', async () => {
    let answer!: (leave: boolean) => void;
    const pending = new Promise<boolean>((resolve) => (answer = resolve));

    const result = runGuard({ canDeactivate: () => pending });
    expect(result).toBe(pending);

    answer(false);
    await expect(result).resolves.toBe(false);
  });
});
