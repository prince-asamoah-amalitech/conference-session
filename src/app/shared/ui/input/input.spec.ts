import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { UiInput } from './input';

describe('UiInput', () => {
  let fixture: ComponentFixture<UiInput>;
  let control: FormControl<string>;

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiInput] }).compileComponents();

    control = new FormControl('', { nonNullable: true, validators: Validators.required });
    fixture = TestBed.createComponent(UiInput);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('name', 'title');
    fixture.componentRef.setInput('label', 'Title');
    fixture.componentRef.setInput('errorText', 'A title is required.');
    await fixture.whenStable();
  });

  it('renders a native input carrying the name', () => {
    expect(input().getAttribute('name')).toBe('title');
  });

  it('binds the control both ways', async () => {
    control.setValue('Signals');
    await fixture.whenStable();
    expect(input().value).toBe('Signals');

    input().value = 'Zoneless';
    input().dispatchEvent(new Event('input'));
    expect(control.value).toBe('Zoneless');
  });

  it('stays quiet while the control is untouched', () => {
    expect(fixture.nativeElement.querySelector('.ui-error')).toBeNull();
    expect(input().classList.contains('ui-input-invalid')).toBe(false);
  });

  it('shows the error once the control is touched', async () => {
    control.markAsTouched();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.ui-error')?.textContent).toContain(
      'A title is required.',
    );
    expect(input().classList.contains('ui-input-invalid')).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('points aria-describedby at the visible message', async () => {
    control.markAsTouched();
    await fixture.whenStable();

    const error = fixture.nativeElement.querySelector('.ui-error');
    expect(input().getAttribute('aria-describedby')).toBe(error.id);
  });

  it('associates the label with the input', () => {
    const label = fixture.nativeElement.querySelector('label');
    expect(label.getAttribute('for')).toBe(input().id);
  });
});
