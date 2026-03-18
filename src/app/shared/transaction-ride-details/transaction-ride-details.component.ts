import { Component, Input, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PaymentService } from 'src/app/core/services/payment.service';

import * as moment from 'moment';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';

@Component({
  selector: 'app-transaction-ride-details',
  templateUrl: './transaction-ride-details.component.html',
  styleUrls: ['./transaction-ride-details.component.scss'],
})
export class TransactionRideDetailsComponent implements OnInit {

  @Input() rideBookingId: any;

  subscription: Subscription[] = [];
  userDetails: any;
  rideDetails: any;
  loading: any;
  fromTime: any;
  endTime: any
  showMore: boolean = false;

  constructor(
    private PaymentService: PaymentService,
    private loadingCtrl: LoadingController,
    public alertController: AlertController,
    public modalController: ModalController,
    private localStorageService: LocalStorageService
  ) { }

  ionViewWillEnter() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.getRideDetails();
  }

  ngOnInit() { }

  getRideDetails() {
    this.showLoading();
    this.subscription.push(
      this.PaymentService.getRideHistory(this.rideBookingId).subscribe((res: any) => {

        this.loadingCtrl.dismiss();

        if (res.statusCode === 200) {
          this.rideDetails = res.data[0];
          this.fromTime = moment(this.rideDetails.fromRideTime).format('DD/MM/YY h:mm:ss a');
          this.endTime = moment(this.rideDetails.actualRideTime).format('DD/MM/YY h:mm:ss a');
        } else {
          this.showAlert(res.message);
        }

      })
    );
  }

  showMoreLessClickHandler() {
    this.showMore = !this.showMore;
  }

  closeModal() {
    this.modalController.dismiss();
  }

  onFeedbackSkip() {
    this.closeModal();
  }

  onFeedbackSubmit() {
    this.closeModal();
  }

  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Ride details Loading .....',
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

}
