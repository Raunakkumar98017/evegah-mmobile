import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboadComponent } from './dashboad/dashboad.component';
import { GetHelpComponent } from './get-help/get-help.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ReferralCodeComponent } from './referral-code/referral-code.component';
import { RideHistoryComponent } from './ride-history/ride-history.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';
import { WalletComponent } from './wallet/wallet.component';
import { KycComponent } from './kyc/kyc.component';
import { ProfileComponent } from './profile/profile.component';
import { ScanQRComponent } from './scan-qr/scan-qr.component';
import { DeviceDetailsComponent } from './device-details/device-details.component';
import { RideDetailsComponent } from './ride-details/ride-details.component';
import { FaqsComponent } from './faqs/faqs.component';
import { FaqDetailComponent } from './faq-detail/faq-detail.component';

const routes: Routes = [
  {
    path: '',
    component: DashboadComponent,
  },
  {
    path: 'getHelp',
    component: GetHelpComponent,
  },
  {
    path: 'privacyPolicy',
    component: PrivacyPolicyComponent,
  },
  {
    path: 'referralCode',
    component: ReferralCodeComponent,
  },
  {
    path: 'rideHistory',
    component: RideHistoryComponent,
  },
  {
    path: 'paymentHistory',
    component: PaymentHistoryComponent,
  },
  {
    path: 'Wallet',
    component: WalletComponent,
  },
  {
    path: 'Kyc',
    component: KycComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'ScanQR',
    component: ScanQRComponent,
  },
  {
    path: 'deviceDetails',
    component: DeviceDetailsComponent,
  },
  {
    path: 'rideDetails',
    component: RideDetailsComponent,
  },
  {
    path: 'faqs',
    component: FaqsComponent,
  },
  {
    path: 'faqDetail',
    component: FaqDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomePageRoutingModule { }
