import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanesCurso } from './planes-curso';

describe('PlanesCurso', () => {
  let component: PlanesCurso;
  let fixture: ComponentFixture<PlanesCurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanesCurso],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanesCurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
