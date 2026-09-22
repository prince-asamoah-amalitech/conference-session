import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonDirective, ButtonSize, ButtonVariant } from './button';

@Component({
  imports: [ButtonDirective],
  template: `
    <button appButton [variant]="variant()" [size]="size()" class="mt-3">Go</button>
    <a appButton variant="secondary" href="#">Link</a>
  `,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('md');
}

describe('ButtonDirective', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture;
  }

  it('applies the base and variant recipes', async () => {
    const button = (await render()).nativeElement.querySelector('button');
    expect(button.classList.contains('ui-btn')).toBe(true);
    expect(button.classList.contains('ui-btn-primary')).toBe(true);
  });

  it('keeps static classes already on the element', async () => {
    const button = (await render()).nativeElement.querySelector('button');
    expect(button.classList.contains('mt-3')).toBe(true);
  });

  it('swaps the variant when the input changes', async () => {
    const fixture = await render();
    fixture.componentInstance.variant.set('danger');
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('ui-btn-danger')).toBe(true);
    expect(button.classList.contains('ui-btn-primary')).toBe(false);
  });

  it('adds the small size recipe only when asked', async () => {
    const fixture = await render();
    expect(fixture.nativeElement.querySelector('button').classList.contains('ui-btn-sm')).toBe(
      false,
    );

    fixture.componentInstance.size.set('sm');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').classList.contains('ui-btn-sm')).toBe(
      true,
    );
  });

  it('works on an anchor', async () => {
    const anchor = (await render()).nativeElement.querySelector('a');
    expect(anchor.classList.contains('ui-btn')).toBe(true);
    expect(anchor.classList.contains('ui-btn-secondary')).toBe(true);
  });
});
