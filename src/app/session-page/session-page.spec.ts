import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionPage } from './session-page';
import { SessionService } from './services/session';

describe('SessionPage', () => {
  let component: SessionPage;
  let fixture: ComponentFixture<SessionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionPage);
    fixture.componentRef.setInput('q', '');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists every session when no search term is set', async () => {
    const total = TestBed.inject(SessionService).count();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(total);
  });

  it('filters the list by the q input', async () => {
    fixture.componentRef.setInput('q', 'postgres');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });
});
