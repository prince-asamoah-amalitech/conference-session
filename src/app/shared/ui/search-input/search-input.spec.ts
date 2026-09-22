import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSearchInput } from './search-input';

describe('UiSearchInput', () => {
  let fixture: ComponentFixture<UiSearchInput>;

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiSearchInput] }).compileComponents();

    fixture = TestBed.createComponent(UiSearchInput);
    fixture.componentRef.setInput('label', 'Search sessions');
    await fixture.whenStable();
  });

  it('renders a search input', () => {
    expect(input().type).toBe('search');
  });

  it('reflects the value input', async () => {
    fixture.componentRef.setInput('value', 'postgres');
    await fixture.whenStable();
    expect(input().value).toBe('postgres');
  });

  it('emits what the user typed', () => {
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

    input().value = 'angular';
    input().dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['angular']);
  });
});
