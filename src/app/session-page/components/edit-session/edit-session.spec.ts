import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditSession } from './edit-session';
import { SessionService } from '../../services/session';

describe('EditSession', () => {
  let component: EditSession;
  let fixture: ComponentFixture<EditSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSession],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EditSession);
    fixture.componentRef.setInput('id', TestBed.inject(SessionService).all()[0].id);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allows navigation away while the form is untouched', () => {
    expect(component.canDeactivate()).toBe(true);
  });
});
