import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';

import { Subscription } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service'
import { ToasterService } from 'src/app/core/services/toaster.service';
import { EnumService } from 'src/app/core/services/enum.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';
import { VehicleModelService } from 'src/app/core/services/Vehicle-services';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
@Component({
  selector: 'app-withdraw-amount-modal',
  templateUrl: './withdraw-amount-modal.component.html',
  styleUrls: ['./withdraw-amount-modal.component.scss'],
})
export class WithdrawAmountModalComponent implements OnInit {
  @Output() onSuccessfulWithdraw = new EventEmitter();

  value: any;
  loading: any;

  withdrawAmount!: any;
  userDetails: any;
  userDetailForRide: any;
  subscription: Subscription[] = [];
  Withdrawnlist = [];
  withForm!: FormGroup;
  WalletAmount!: number
  constructor(
    public router: Router,
    public formBuilder: FormBuilder,
    public PaymentService: PaymentService,
    public toasterService: ToasterService,
    private authService: AuthService,
    private enumService: EnumService,
    private loadingCtrl: LoadingController,
    public alertController: AlertController,
    private vehicleServices: VehicleModelService,
    private localStorageService: LocalStorageService
  ) { }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.userDetail();
    this.getLastRideBookingDetails();
  }

  userDetail() {
    this.subscription.push(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe((res) => {
        if (res.statusCode === 200) {
          this.userDetailForRide = res.data[0];
          this.WalletAmount = this.userDetailForRide.walletAmount;
        } else if (res.statusCode === 401) {
          this.authService.logout();
        } else {
          this.showAlert(res.message);
        }
      })
    );
  }

  getLastRideBookingDetails() {

    this.subscription.push(
      this.vehicleServices.userRideDetails().subscribe((res) => {
        if (res.statusCode === 200) {

          if (res.data.length > 0) {
            if (Number(res.data[0].bikeRidingStatus) === enumCodeConstants.bikeRiding) {
              this.router.navigate(['home']);
              this.showAlert("Sorry, but you can't withdraw funds from your wallet while your ride is still ongoing.");
            }
          }

        } else {
          this.showAlert(res.message);
        }
      })
    );
  }

  withdrawAmounts(amount: any) {

    if (!amount || amount < 0) {

      this.showAlert('Please enter valid amount');

    } else if (this.WalletAmount <= Number(amount)) {

      this.showAlert('Amount more than or equal to a wallet amount can not be withdrawn');

    } else {

      this.showLoading();

      this.subscription.push(
        this.PaymentService.addWithdrawRequestFromUser(Number(amount)).subscribe((res) => {
          if (res.statusCode === 200) {
            this.showAlert(`Your withdrawn request has been submitted. You can check the status of your withdrawn requests in the payment history section.`);
            this.loadingCtrl.dismiss();
            this.onSuccessfulWithdraw.emit();
            this.withdrawAmount = undefined;
          } else {
            this.loadingCtrl.dismiss();
            this.showAlert(res.message);
          }
        })
      );
    }

  }

  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Request Processing .....',
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
