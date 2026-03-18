import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

import { Subscription } from 'rxjs';
import { Checkout } from 'capacitor-razorpay';

import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { PaymentService } from '../../core/services/payment.service'
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { EnumService } from 'src/app/core/services/enum.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

import { AuthService } from 'src/app/service/auth.service';
import { SpinnerService } from 'src/app/core/services/spinner.services';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import messageConstants from 'src/app/core/constants/message-constants';

@Component({
  selector: 'app-wallet-balance-modal',
  templateUrl: './wallet-balance-modal.component.html',
  styleUrls: ['./wallet-balance-modal.component.scss'],
})
export class WalletBalanceModalComponent implements OnInit {
  @Input() amount: any;
  @Input() availableAmount: any;
  @Output() onSuccessfulDeposit = new EventEmitter();

  value: any;
  loading: any;

  userDetails: any;
  pageTitle = 'Add Evegah Cash';
  addBalanceForm!: FormGroup;
  subscription: Subscription[] = [];
  userWallet!: number;
  userWalletData: any;
  enterAmount!: any;

  constructor(public router: Router,
    public toasterService: ToasterService,
    public formBuilder: FormBuilder,
    private enumService: EnumService,
    private authService: AuthService,
    private alertController: AlertController,
    public PaymentService: PaymentService,
    public spinnerService: SpinnerService,
    private loadingCtrl: LoadingController,
    private localStorageService: LocalStorageService
  ) { }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);

    if (this.amount) {
      this.enterAmount = this.amount;
    }

  }

  addBalanceButton(enterAmount: number) {

    if (enterAmount) {

      if (enterAmount < 0) {
        return this.showAlert(messageConstants.pleaseEnterValidWalletAmount);
      }

      this.showLoading();

      this.subscription.push(
        this.PaymentService.orderDataService(enterAmount, 1).subscribe({
          next: (res) => {
            if (res.statusCode === 200) {

              const data = res.data;
              const options = {
                key: data?.key_id || environment.rakorpayKey,
                amount: data.amount,
                description: 'add in wallet',
                image: 'https://admin.evegah.com/assets/images/EVfinalicon.svg',
                order_id: data.id,//Order ID generated in Step 1
                currency: data.currency,
                name: this.userDetails?.userName,
                retry: false,
                prefill: {
                  email: this.userDetails?.emailId,
                  contact: this.userDetails?.mobile
                },
                theme: {
                  color: '#2a195c'
                }
              };

              this.payWithRazorpay(options, enterAmount);

            } else {
              this.showAlert(res.message);
              this.loadingCtrl.dismiss();
            }
          },
          error: (error: any) => {
            this.showAlert(error?.error?.message || error?.message || 'Something went wrong. Please try again.');
            this.loadingCtrl.dismiss();
          }
        })
      );

    } else {
      this.showAlert(messageConstants.pleaseEnterWalletAmount);
    }

  }

  async payWithRazorpay(options: any, enterAmount: any) {
    try {

      const data = await Checkout.open(options);
      this.verifyPaymentsApi(data, enterAmount);

    } catch (error) {

      const _error = typeof error === 'string' ? JSON.parse(error) : error;

      this.showAlert(_error.description);
      this.loadingCtrl.dismiss();

      if (_error.metadata) {
        this.verifyPaymentsApi(_error, enterAmount);
      }

    }
  }

  verifyPaymentsApi(data: any, enterAmount: any) {

    const dataResponseAvailable = typeof data.response === 'undefined' ? false : true;

    const verifyPaymentData = {
      razorpay_payment_id: dataResponseAvailable ? data.response.razorpay_payment_id : data.metadata.payment_id,
      razorpay_order_id: dataResponseAvailable ? data.response.razorpay_order_id : data.metadata.order_id,
      razorpay_signature: dataResponseAvailable ? data.response.razorpay_signature : null,
      createdByUserId: this.userDetails.userId
    };

    this.subscription.push(
      this.PaymentService.verifyorderService(verifyPaymentData).subscribe((res) => {
        if (res.statusCode === 200) {

          if (res.data.signatureIsValid === true) {

            let AmountUserWallet = {
              "amount": Number(enterAmount),
              "id": this.userDetails.userId,
              "receivedAmount": Number(enterAmount),
              "paymentTransactionId": res.data.paymentTransactionId
            };

            this.addAmountUserWallet(AmountUserWallet)

          } else {

            this.showAlert(messageConstants.paymentCancelled);
            this.loadingCtrl.dismiss();

          }

        } else {
          this.showAlert(messageConstants.paymentCancelled);
          this.loadingCtrl.dismiss();

        }
      }, (error: any) => {
        this.showAlert(error?.error?.message || error?.message || messageConstants.paymentCancelled);
        this.loadingCtrl.dismiss();
      })
    );
  }

  addAmountUserWallet(AmountUserWallet: any) {
    this.subscription.push(
      this.PaymentService.addAmountToUserWallet(AmountUserWallet).subscribe((res) => {

        this.loadingCtrl.dismiss();

        if (res.statusCode === 200) {
          this.onSuccessfulDeposit.emit();
          this.enterAmount = undefined;
        } else {
          this.showAlert(res.message);
        }

      })
    );
  }

  handleTopUpControlClick(amount: number) {
    this.enterAmount = amount;
  }

  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Payment Processing .....',
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

  async showAlert(message: string) {
    (document.activeElement as HTMLElement | null)?.blur();

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

}
