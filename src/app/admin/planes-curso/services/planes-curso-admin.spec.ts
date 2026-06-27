import { TestBed } from '@angular/core/testing';

import { PlanesCursoAdmin } from './planes-curso-admin';

describe('PlanesCursoAdmin', () => {
  let service: PlanesCursoAdmin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanesCursoAdmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
