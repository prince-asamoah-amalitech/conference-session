import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { UiSegmentGroup } from './segment-group';

describe('UiSegmentGroup', () => {
  let fixture: ComponentFixture<UiSegmentGroup>;
  let control: FormControl<string>;

  function radios(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiSegmentGroup] }).compileComponents();

    control = new FormControl('frontend', { nonNullable: true });
    fixture = TestBed.createComponent(UiSegmentGroup);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('options', ['frontend', 'backend', 'ai']);
    fixture.componentRef.setInput('label', 'Track');
    await fixture.whenStable();
  });

  it('renders one radio per option', () => {
    expect(radios().length).toBe(3);
  });

  it('marks the selected option', async () => {
    const active = fixture.nativeElement.querySelectorAll('.ui-segment-active');
    expect(active.length).toBe(1);
    expect(active[0].textContent).toContain('frontend');

    control.setValue('ai');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.ui-segment-active').textContent).toContain('ai');
  });

  it('writes the chosen option back to the control', () => {
    radios()[1].click();
    expect(control.value).toBe('backend');
  });

  it('exposes the group to assistive tech', () => {
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');
    expect(group.getAttribute('aria-label')).toBe('Track');
  });
});
