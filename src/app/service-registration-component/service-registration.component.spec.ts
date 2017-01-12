/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

import {ServiceRegistrationComponent} from './service-registration.component';
import {EthereumService} from "../services/ethereum/ethereum.service";
import {IpfsService} from "../services/ipfs/ipfs.service";
import {ServiceRepositoryService} from "../services/service-repository/service-repository.service";
import {FormsModule} from "@angular/forms";
import {SpinnerComponent} from "../directives/spinner/spinner.component";
import {ServiceDetailsComponent} from "../service-component/service-details-component/service-details.component";
import {SafePipe} from "../pipes/safe-url.pipe";

describe('ServiceRegistrationComponent', () => {
  let component: ServiceRegistrationComponent;
  let fixture: ComponentFixture<ServiceRegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceRegistrationComponent, SpinnerComponent, ServiceDetailsComponent, SafePipe],
      providers: [ServiceRepositoryService, IpfsService, EthereumService],
      imports: [FormsModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // expect(component).toBeTruthy();
    expect(component).toBeDefined();
  });
});
