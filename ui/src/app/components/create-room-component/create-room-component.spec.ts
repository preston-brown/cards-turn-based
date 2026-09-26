import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CreateRoomComponent } from './create-room-component';
import { BackendService } from '../../services/backend-service';

describe('CreateRoomComponent', () => {
  let component: CreateRoomComponent;
  let fixture: ComponentFixture<CreateRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRoomComponent],
      providers: [
        { provide: BackendService, useValue: { createRoom: () => of({ id: 'room-1', name: 'Test room' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRoomComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
