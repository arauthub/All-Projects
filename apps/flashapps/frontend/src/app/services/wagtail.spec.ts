import { TestBed } from '@angular/core/testing';

import { Wagtail } from './wagtail';

describe('Wagtail', () => {
  let service: Wagtail;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Wagtail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
