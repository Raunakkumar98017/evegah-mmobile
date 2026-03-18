import { Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PaymentService } from 'src/app/core/services/payment.service';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';
import { TransactionRideDetailsComponent } from 'src/app/shared/transaction-ride-details/transaction-ride-details.component';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
})
export class PaymentHistoryComponent implements OnInit {

  pageTitle = 'Payment History';
  subscription: Subscription[] = [];
  userDetails: any;
  userTransactionDetailList: any = null;
  loading: any;
  _enumCodeConstants: any;

  constructor(
    private PaymentService: PaymentService,
    private loadingCtrl: LoadingController,
    public modalController: ModalController,
    private localStorageService: LocalStorageService
  ) { }

  ionViewWillEnter() {
    this._enumCodeConstants = enumCodeConstants;
  }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.getLatestTransactionList();
  }

  getLatestTransactionList() {
    this.showLoading();
    this.subscription.push(
      this.PaymentService.getLatestTransactionList(this.userDetails.userId).subscribe((res) => {
        if (res.statusCode === 200) {
          res.data.forEach((element: any) => {
            element.hiring_charges = Number(element.hiring_charges)
            element.amount = Number(element.amount)
            element.extra_charges = Number(element.extra_charges)
          });
          this.userTransactionDetailList = res.data;
          this.loadingCtrl.dismiss();
        } else {
          this.userTransactionDetailList = [];
          this.loadingCtrl.dismiss();
        }
      })
    );
  }

  async handleViewDetails(transactionDetails: any) {

    const modal = await this.modalController.create({
      component: TransactionRideDetailsComponent,
      componentProps: {
        rideBookingId: transactionDetails.rideBookingId
      }
    });

    return await modal.present();

  }

  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Payment History Loading .....',
      //  duration:3000,
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

}
