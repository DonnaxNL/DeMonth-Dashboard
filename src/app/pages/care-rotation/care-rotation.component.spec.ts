import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CareRotationComponent } from './care-rotation.component';

describe('CareRotationComponent', () => {
  let component: CareRotationComponent;
  let fixture: ComponentFixture<CareRotationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CareRotationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CareRotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
