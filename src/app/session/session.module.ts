import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOtpInputModule } from 'ng-otp-input';

import { SessionRoutingModule } from './session-routing.module';
import { MobileNumberComponent } from './mobile-number/mobile-number.component';
import { BasicInfoComponent } from './basic-info/basic-info.component';
import { OtpComponent } from './otp/otp.component';
import { SharedModule } from '../shared/shared.module';
import { TermsConditionsComponent } from './terms-conditions/terms-conditions.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SessionRoutingModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    NgOtpInputModule
  ],
  declarations: [
    MobileNumberComponent,
    OtpComponent,
    BasicInfoComponent,
    TermsConditionsComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
})
export class SessionModule { }
