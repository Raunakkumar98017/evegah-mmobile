import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

import { PaymentService } from 'src/app/core/services/payment.service';
import { TransactionRideDetailsComponent } from 'src/app/shared/transaction-ride-details/transaction-ride-details.component';

@Component({
  selector: 'app-ride-history',
  templateUrl: './ride-history.component.html',
  styleUrls: ['./ride-history.component.scss'],
})
export class RideHistoryComponent implements OnInit {

  pageTitle = 'Ride History';
  subscription: Subscription[] = [];
  userDetails: any;
  rideHistory: any = null;
  loading: any;

  constructor(
    private PaymentService: PaymentService,
    private loadingCtrl: LoadingController,
    public alertController: AlertController,
    public modalController: ModalController,
    private localStorageService: LocalStorageService,
  ) { }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.getRideHistory();
  }

  getRideHistory() {
    this.showLoading();
    this.subscription.push(
      this.PaymentService.getRideHistory().subscribe((res: any) => {

        this.loadingCtrl.dismiss();

        if (res.statusCode === 200) {
          this.rideHistory = res.data;
        } else {
          this.rideHistory = [];
          this.showAlert(res.message);
        }
      })
    );
  }

  async handleViewDetails(history: any) {

    const modal = await this.modalController.create({
      component: TransactionRideDetailsComponent,
      componentProps: {
        rideBookingId: history.rideBookingId
      }
    });

    return await modal.present();

  }

  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Ride History Loading .....',
      //  duration:3000,
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
  }

}
