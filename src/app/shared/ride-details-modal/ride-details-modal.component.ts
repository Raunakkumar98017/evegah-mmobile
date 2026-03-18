import { Component, Input, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';

import * as moment from 'moment';

@Component({
  selector: 'app-ride-details-modal',
  templateUrl: './ride-details-modal.component.html',
  styleUrls: ['./ride-details-modal.component.scss'],
})
export class RideDetailsModalComponent implements OnInit {

  @Input() rideDetails: any;
  @Input() rideBookingId: any;

  fromTime: any = null;
  endTime: any = null;
  showMinimumHireTime = false;
  showPayNow = false;
  showMore: boolean = false;
  feedbackSubmitted: boolean = false;

  constructor(
    public router: Router,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    this.fromTime = moment(this.rideDetails.startRideTime).format('DD/MM/YY h:mm:ss a');
    this.endTime = moment(this.rideDetails.endRideTime).format('DD/MM/YY h:mm:ss a');

    if (this.rideDetails.totalDurationInMinutes < +this.rideDetails.minimumHireTime) {
      this.showMinimumHireTime = true;
    }

    if (+this.rideDetails.remainingwalletAmount < 0) {
      this.showPayNow = true;
    }

  }

  payNow() {

    const navigationExtras: NavigationExtras = {
      queryParams: {
        amount: this.rideDetails.remainingwalletAmount
      },
    };

    this.router.navigate(['home/Wallet'], navigationExtras);
    this.modalCtrl.dismiss();

  }

  closeModal() {
    this.router.navigate(['home']);
    this.modalCtrl.dismiss();
  }

  showMoreLessClickHandler() {
    this.showMore = !this.showMore;
  }

  onFeedbackSkip() {
    this.closeModal();
  }

  onFeedbackSubmit() {

    if (this.showPayNow === false) {
      return this.closeModal();
    }

    this.feedbackSubmitted = true;

  }

}
