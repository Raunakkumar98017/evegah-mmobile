import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { HomePageRoutingModule } from './home-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ProfileComponent } from './profile/profile.component';
import { IonicModule } from '@ionic/angular';
// import { AddBallanceComponent } from './add-ballance/add-ballance.component';
import { DashboadComponent } from './dashboad/dashboad.component';
import { ScanQRComponent } from './scan-qr/scan-qr.component';
// import { DeviceDetailsOldComponent } from './device-details-old/device-details.component';
import { WalletComponent } from './wallet/wallet.component';
import { KycComponent } from './kyc/kyc.component';
// import { WithdrawComponent } from './withdraw/withdraw.component';
// import { VehiclePageModule } from './vehicle/vehicle.module';
import { MatDialogModule } from '@angular/material/dialog';
// import { RidePaymentsHistoryComponent } from './ride-payments-history/ride-payments-history.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';
import { RideHistoryComponent } from './ride-history/ride-history.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
// import { BluetoothComponent } from './bluetooth/bluetooth.component';

import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { GetHelpComponent } from './get-help/get-help.component';
import { ReferralCodeComponent } from './referral-code/referral-code.component';
import { DeviceDetailsComponent } from './device-details/device-details.component';
import { RideDetailsComponent } from './ride-details/ride-details.component';
import { FaqsComponent } from './faqs/faqs.component';
import { FaqDetailComponent } from './faq-detail/faq-detail.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    MatDialogModule,
    IonicModule,
    HomePageRoutingModule,
    // VehiclePageModule,
    FormsModule,
    ReactiveFormsModule,
    // CdTimerModule,
    HttpClientModule,

  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    DashboadComponent,
    WalletComponent,
    KycComponent,
    ProfileComponent,
    ScanQRComponent,
    DeviceDetailsComponent,
    PrivacyPolicyComponent,
    GetHelpComponent,
    RideHistoryComponent,
    PaymentHistoryComponent,
    ReferralCodeComponent,
    RideDetailsComponent,
    FaqsComponent,
    FaqDetailComponent
  ],
  exports: [],
})
export class HomePageModule { }
