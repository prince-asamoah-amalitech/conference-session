import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaveChangesDialog } from './save-changes-dialog';

describe('SaveChangesDialog', () => {
  let component: SaveChangesDialog;
  let fixture: ComponentFixture<SaveChangesDialog>;

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
});
