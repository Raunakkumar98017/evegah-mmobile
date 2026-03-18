import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MobileNumberComponent } from './mobile-number/mobile-number.component';
import { OtpComponent } from './otp/otp.component';
import { BasicInfoComponent } from './basic-info/basic-info.component';
import { TermsConditionsComponent } from './terms-conditions/terms-conditions.component';

const routes: Routes = [
  { path: '', component: MobileNumberComponent },
  { path: 'otp', component: OtpComponent },
  { path: 'basic-info', component: BasicInfoComponent },
  { path: 'termsConditions', component: TermsConditionsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class SessionRoutingModule { }
