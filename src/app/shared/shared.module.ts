import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { IonicModule } from '@ionic/angular';

import {
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  Pipe,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ChildHeaderComponent } from './child-header/child-header.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
// import { RideCompletDilogComponent } from './ride-complet-dilog/ride-complet-dilog.component';
// import { BottomModalComponent } from './bottom-modal/bottom-modal.component';
import { WalletBalanceModalComponent } from './wallet-balance-modal/wallet-balance-modal.component';
import { WithdrawAmountModalComponent } from './withdraw-amount-modal/withdraw-amount-modal.component';
import { UserKYCComponent } from './user-kyc/user-kyc.component';
// import { TermsConditionsComponent } from '../home/terms-conditions/terms-conditions.component';
// import { PrivacyPolicyComponent } from '../home/privacy-policy/privacy-policy.component';
import { RideDetailsModalComponent } from './ride-details-modal/ride-details-modal.component';
import { TransactionRideDetailsComponent } from './transaction-ride-details/transaction-ride-details.component';
import { SearchableSelectComponent } from './searchable-select/searchable-select.component';
import { MapComponent } from './map/map.component';
import { RatingFeedbackComponent } from './rating-feedback/rating-feedback.component';
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
// export function createTranslateLoader(http: HttpClient) {
//   return new TranslateHttpLoader(http, '../assets/i18n/', '.json');
// }
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
  ],

  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FooterComponent,
    HeaderComponent,
    ChildHeaderComponent,
    ConfirmDialogComponent,
    WalletBalanceModalComponent,
    WithdrawAmountModalComponent,
    UserKYCComponent,
    RideDetailsModalComponent,
    TransactionRideDetailsComponent,
    SearchableSelectComponent,
    MapComponent,
    RatingFeedbackComponent
  ],

  providers: [],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  declarations: [
    HeaderComponent,
    FooterComponent,
    ChildHeaderComponent,
    ConfirmDialogComponent,
    TransactionRideDetailsComponent,
    WalletBalanceModalComponent,
    WithdrawAmountModalComponent,
    UserKYCComponent,
    RideDetailsModalComponent,
    SearchableSelectComponent,
    MapComponent,
    RatingFeedbackComponent
  ],
})
export class SharedModule { }