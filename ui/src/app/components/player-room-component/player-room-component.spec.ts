import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerRoomComponent } from './player-room-component';

describe('PlayerRoomComponent', () => {
  let component: PlayerRoomComponent;
  let fixture: ComponentFixture<PlayerRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerRoomComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerRoomComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
