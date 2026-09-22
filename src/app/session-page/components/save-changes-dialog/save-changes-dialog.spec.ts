import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaveChangesDialog } from './save-changes-dialog';

describe('SaveChangesDialog', () => {
  let component: SaveChangesDialog;
  let fixture: ComponentFixture<SaveChangesDialog>;

  function dialog(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="alertdialog"]');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveChangesDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveChangesDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Regression: the dialog used to stay mounted and hide itself with a bound class,
   * so it flashed up for a frame on every page that hosts it.
   */
  it('renders nothing at all while closed', () => {
    expect(dialog()).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('renders once opened', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    expect(dialog()).not.toBeNull();
  });

  it('emits false when the user stays', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    const decisions: boolean[] = [];
    component.decision.subscribe((value) => decisions.push(value));
    fixture.nativeElement.querySelectorAll('button')[1].click();

    expect(decisions).toEqual([false]);
  });

  it('emits true when the user discards', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    const decisions: boolean[] = [];
    component.decision.subscribe((value) => decisions.push(value));
    fixture.nativeElement.querySelectorAll('button')[0].click();

    expect(decisions).toEqual([true]);
  });

  it('stays put when Escape is pressed while closed', () => {
    const decisions: boolean[] = [];
    component.decision.subscribe((value) => decisions.push(value));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(decisions).toEqual([]);
  });
});
