import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressViewComponent } from './address-view.component';

describe('AddressViewComponent', () => {
  let component: AddressViewComponent;
  let fixture: ComponentFixture<AddressViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddressViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddressViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
