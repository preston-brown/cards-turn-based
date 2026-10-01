import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarRoomComponent } from './war-room-component';

describe('WarRoomComponent', () => {
  let component: WarRoomComponent;
  let fixture: ComponentFixture<WarRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarRoomComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WarRoomComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
