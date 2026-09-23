import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageNotFound } from './page-not-found';

describe('PageNotFound', () => {
  let component: PageNotFound;
  let fixture: ComponentFixture<PageNotFound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageNotFound],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PageNotFound);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('says the page was not found', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Page not found');
  });

  it('links back to the session list', () => {
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/sessions');
  });
});
