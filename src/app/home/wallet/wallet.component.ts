import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service';
import { VehicleModelService } from '../../core/services/Vehicle-services';
import { EnumService } from 'src/app/core/services/enum.service';
import { AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';
import { SpinnerService } from 'src/app/core/services/spinner.services';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { Checkout } from 'capacitor-razorpay';
import { environment } from 'src/environments/environment';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';



@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletComponent implements OnInit, OnDestroy {
  pageTitle = 'My Wallet';
  private subscriptions: Subscription = new Subscription();
  
  userDetails: any;
  walletAmount: number = 0;
  extraCharges: number = 0;
  
  // Avatar Sync (Matches key from Profile Component)
  avatarPreviewUrl: string = ''; 
  private readonly profileImageStorageKey = 'mobile_profile_avatar_base64';

  userTransactionDetailList: any[] = []; 
  displayTransactions: any[] = [];     
  private itemsPerPage = 5;

  amountFromQuery: any;
  depositAmount: number | null = null;
  withdrawAmount: number | null = null;

  constructor(
    public router: Router,
    private enumService: EnumService,
    public vehicleModelService: VehicleModelService,
    public activatedRoute: ActivatedRoute,
    private authService: AuthService,
    public paymentService: PaymentService,
    public spinnerService: SpinnerService,
    private changeDetection: ChangeDetectorRef,
    public alertController: AlertController,
    private localStorageService: LocalStorageService,
  ) { }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.loadAvatar();
    
    
    this.fetchUserWalletData();
    this.getLatestTransactionList();

    this.subscriptions.add(
      this.activatedRoute.queryParams.subscribe((params: any) => {
        if (params.amount) {
          this.depositAmount = Number(Math.abs(+params.amount));
        }
      })
    );
  }

  ionViewWillEnter() {
    this.loadAvatar();
  }

  private loadAvatar() {
    this.avatarPreviewUrl =
      this.localStorageService.getItem(storageKeyNameConstants.USER_AVATAR, true) ||
      localStorage.getItem(this.profileImageStorageKey) ||
      '';
  }

  fetchUserWalletData() {
    this.spinnerService.presentLoading();
    this.subscriptions.add(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            const data = res.data[0];
            this.walletAmount = data.walletAmount;
            this.extraCharges = Math.round(data.extraCharges);
          } else if (res.statusCode === 401) {
            this.authService.logout();
          }
          this.spinnerService.dismissLoading();
          this.changeDetection.detectChanges();
        },
        error: () => this.spinnerService.dismissLoading()
      })
    );
  }

  private getLatestTransactionList() {
    this.subscriptions.add(
      this.paymentService.getLatestTransactionList(this.userDetails.userId).subscribe({
        next: (res: any) => {
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            this.userTransactionDetailList = res.data.map((item: any) => ({
              ...item,
              amount: Number(item.amount || 0),
              extra_charges: Number(item.extra_charges || 0),
              hiring_charges: Number(item.hiring_charges || 0)
            }));
            this.displayTransactions = this.userTransactionDetailList.slice(0, this.itemsPerPage);
          }
          this.changeDetection.detectChanges();
        }
      })
    );
  }

  loadMoreTransactions() {
    const len = this.displayTransactions.length;
    const next = this.userTransactionDetailList.slice(len, len + this.itemsPerPage);
    this.displayTransactions = [...this.displayTransactions, ...next];
    this.changeDetection.detectChanges();
  }

  // --- Helpers ---

  getTransactionIcon(tx: any): string {
    const title = this.getTransactionTitle(tx).toLowerCase();
    if (this.isCredit(tx)) return 'add-circle-outline';
    if (title.includes('ride')) return 'bicycle-outline';
    if (title.includes('withdraw')) return 'arrow-up-circle-outline';
    return 'swap-horizontal-outline';
  }

  isCredit(tx: any): boolean {
    const transactionType = Number(tx?.transaction_type_enum_id);
    const title = this.getTransactionTitle(tx).toLowerCase();

    return transactionType === Number(enumCodeConstants.paymentTransactionAddWallet)
      || title.includes('recharge')
      || title.includes('deposit')
      || title.includes('top up')
      || title.includes('topup')
      || title.includes('add wallet');
  }

  getTransactionSign(tx: any): '+' | '-' {
    return this.isCredit(tx) ? '+' : '-';
  }

  getTransactionAmount(tx: any): number {
    return Math.abs(Number(tx?.amount || 0) + Number(tx?.extra_charges || 0) + Number(tx?.hiring_charges || 0));
  }

  getTransactionTitle(tx: any): string {
    return tx?.method || tx?.transaction_type || 'Wallet Activity';
  }

  getStatusText(tx: any): string {
    const s = `${tx?.withdraw_request_status || ''}`.toLowerCase();
    if (s.includes('pending')) return 'Pending';
    if (s.includes('fail')) return 'Failed';
    return 'Success';
  }

  getStatusClass(tx: any): string { return this.getStatusText(tx).toLowerCase(); }

  // --- Payment Logic ---

  async openAmountPrompt(mode: 'deposit' | 'withdraw') {
    (document.activeElement as HTMLElement | null)?.blur();
    const alert = await this.alertController.create({
      header: mode === 'deposit' ? 'Add Assets' : 'Withdrawal',
      subHeader: 'Enter amount to proceed',
      cssClass: 'wallet-amount-alert',
      inputs: [{ name: 'amount', type: 'number', placeholder: '₹0.00' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', handler: (data) => {
          const enteredAmount = Number(data?.amount);
          if (!enteredAmount || enteredAmount <= 0) {
            return false;
          }

          if (mode === 'deposit') {
            this.depositAmount = enteredAmount;
            this.submitDeposit();
          } else {
            this.withdrawAmount = enteredAmount;
            this.submitWithdraw();
          }

          return true;
        }}
      ]
    });
    await alert.present();
  }

  submitDeposit() {
    if (!this.depositAmount || this.depositAmount <= 0) return;
    this.spinnerService.presentLoading();
    this.subscriptions.add(
      this.paymentService.orderDataService(this.depositAmount, 1).subscribe({
        next: (res) => {
          if (res?.statusCode === 200 && res?.data?.id) {
            const options = {
              key: res?.data?.key_id || environment.rakorpayKey,
              amount: res.data.amount,
              order_id: res.data.id,
              currency: res.data.currency,
              name: this.userDetails?.userName,
              theme: { color: '#6c45be' }
            };
            this.payWithRazorpay(options, this.depositAmount!);
            return;
          }

          this.spinnerService.dismissLoading();
          void this.showErrorAlert(res?.message || 'Unable to start payment. Please try again.');
        },
        error: (error) => {
          this.spinnerService.dismissLoading();
          void this.showErrorAlert(this.extractApiErrorMessage(error));
        }
      })
    );
  }

  async payWithRazorpay(options: any, amount: number) {
    try {
      const data = await Checkout.open(options);
      this.verifyPayment(data, amount);
    } catch (error: any) {
      this.spinnerService.dismissLoading();
      const message = this.extractRazorpayErrorMessage(error);
      void this.showErrorAlert(message);
    }
  }

  private extractRazorpayErrorMessage(error: any): string {
    const normalize = (value: any): string => `${value || ''}`.toLowerCase().trim();

    const resolveFromPayload = (payload: any): string | null => {
      if (!payload) {
        return null;
      }

      if (typeof payload === 'string') {
        const trimmedPayload = payload.trim();

        if (!trimmedPayload) {
          return null;
        }

        if (trimmedPayload.startsWith('{') || trimmedPayload.startsWith('[')) {
          try {
            return resolveFromPayload(JSON.parse(trimmedPayload));
          } catch {
            return 'Payment could not be completed. Please try again.';
          }
        }

        const loweredPayload = trimmedPayload.toLowerCase();
        if (
          loweredPayload.includes('payment_authentication') ||
          loweredPayload.includes('payment_error') ||
          loweredPayload.includes('bad_request_error') ||
          loweredPayload.includes('cancel')
        ) {
          return 'Payment cancelled.';
        }

        return trimmedPayload;
      }

      const code = normalize(payload?.code);
      const reason = normalize(payload?.reason);
      const step = normalize(payload?.step);

      if (
        reason === 'payment_error' ||
        step === 'payment_authentication' ||
        (code === 'bad_request_error' && (reason === 'payment_error' || step === 'payment_authentication'))
      ) {
        return 'Payment cancelled.';
      }

      return null;
    };

    const candidates = [
      error,
      error?.error,
      error?.description,
      error?.message,
      error?.error?.description,
      error?.error?.message,
      error?.data,
      error?.metadata
    ];

    for (const candidate of candidates) {
      const resolved = resolveFromPayload(candidate);
      if (resolved) {
        return resolved;
      }
    }

    return 'Payment could not be completed. Please try again.';
  }

  verifyPayment(data: any, amount: number) {
    const isSuccess = data.response !== undefined;
    const payload = {
      razorpay_payment_id: isSuccess ? data.response.razorpay_payment_id : data.metadata.payment_id,
      razorpay_order_id: isSuccess ? data.response.razorpay_order_id : data.metadata.order_id,
      razorpay_signature: isSuccess ? data.response.razorpay_signature : null,
      createdByUserId: this.userDetails.userId
    };
    this.subscriptions.add(
      this.paymentService.verifyorderService(payload).subscribe({
        next: (res) => {
          if (res?.statusCode === 200 && res?.data?.signatureIsValid) {
            this.paymentService.addAmountToUserWallet({
              amount, id: this.userDetails.userId, receivedAmount: amount, paymentTransactionId: res.data.paymentTransactionId
            }).subscribe({
              next: () => {
                this.spinnerService.dismissLoading();
                this.fetchUserWalletData();
                this.getLatestTransactionList();
              },
              error: (error) => {
                this.spinnerService.dismissLoading();
                void this.showErrorAlert(this.extractApiErrorMessage(error));
              }
            });
          } else {
            this.spinnerService.dismissLoading();
            void this.showErrorAlert(res?.message || 'Payment verification failed.');
          }
        },
        error: (error) => {
          this.spinnerService.dismissLoading();
          void this.showErrorAlert(this.extractApiErrorMessage(error));
        }
      })
    );
  }

  private extractApiErrorMessage(error: any): string {
    const statusCode = Number(error?.status || error?.error?.statusCode || 0);

    if (statusCode === 401) {
      return 'Your session has expired. Please login again.';
    }

    if (statusCode === 403) {
      return 'Payment is not allowed right now. Please re-login and try again.';
    }

    const candidates = [
      error?.error?.message,
      error?.error?.description,
      error?.message,
      error?.error
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') {
        continue;
      }

      const trimmedMessage = candidate.trim();
      if (!trimmedMessage) {
        continue;
      }

      if (trimmedMessage.startsWith('{') || trimmedMessage.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmedMessage);
          const parsedReason = `${parsed?.reason || ''}`.toLowerCase();
          const parsedStep = `${parsed?.step || ''}`.toLowerCase();
          if (parsedReason === 'payment_error' || parsedStep === 'payment_authentication') {
            return 'Payment cancelled.';
          }
          continue;
        } catch {
          continue;
        }
      }

      if (trimmedMessage.toLowerCase().includes('http failure response')) {
        continue;
      }

      return trimmedMessage;
    }

    return 'Unable to process payment right now. Please try again in a moment.';
  }

  private async showErrorAlert(message: string): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur();
    const alert = await this.alertController.create({
      header: 'Payment Update',
      message,
      cssClass: 'simple-app-alert',
      buttons: ['OK']
    });
    await alert.present();
  }

  submitWithdraw() {
    if (!this.withdrawAmount || this.withdrawAmount > this.walletAmount) return;
    this.spinnerService.presentLoading();
    this.subscriptions.add(
      this.paymentService.addWithdrawRequestFromUser(this.withdrawAmount).subscribe(() => {
        this.spinnerService.dismissLoading();
        this.fetchUserWalletData();
        this.getLatestTransactionList();
      })
    );
  }

  viewAllTransactions() { this.router.navigate(['home/paymentHistory']); }
  backToHome() { this.router.navigate(['home']); }
  navigate(path: string) { this.router.navigate([path]); }
  ngOnDestroy() { this.subscriptions.unsubscribe(); }
}