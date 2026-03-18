import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { APPLICATION_VERSION } from 'src/app/core/constants/common-constant';
import { ERROR_IN_SENDING_OTP } from 'src/app/core/constants/message-constant';
import { generateRandomOtp } from 'src/app/core/helper/common-helper';
import { validateMobileNumber } from 'src/app/core/helper/form-validation-helper';
import { MobileNumberModel } from 'src/app/core/models/session/mobileNumber-model';
import { SessionService } from 'src/app/core/services/session.service';
import { AlertController, NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import messageConstants from 'src/app/core/constants/message-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { SessionStorageService } from 'src/app/core/services/session-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { BiometricAuthService } from 'src/app/core/services/biometric-auth.service';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-mobile-number',
  templateUrl: './mobile-number.component.html',
  styleUrls: ['./mobile-number.component.scss'],
})
export class MobileNumberComponent implements OnInit, OnDestroy {
  mobileNumber!: number;
  phoneCode: string = 'IN';
  errorMsg: string = '';
  isLoading: boolean = false;
  private subs = new Subscription();
  version = APPLICATION_VERSION;
  showBiometricLogin = false;
  biometricLoading = false;

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private alertController: AlertController,
    private localStorageService: LocalStorageService,
    private sessionStorageService: SessionStorageService,
    private biometricAuthService: BiometricAuthService,
    private authService: AuthService,
    private navController: NavController
  ) { }

  async ngOnInit() {
    const existingUser = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    const existingOtpMatch = this.localStorageService.getItem(storageKeyNameConstants.OTP_MATCH, true);

    if (existingUser && existingOtpMatch !== false) {
      this.router.navigate(['/home']);
      return;
    }

    this.sessionStorageService.clearStorage();

    this.showBiometricLogin = await this.canShowBiometricLogin();
  }

  private async canShowBiometricLogin(): Promise<boolean> {
    const supported = await this.biometricAuthService.isAvailable();
    if (!supported) {
      return false;
    }

    const hasCredential = await this.biometricAuthService.hasCredential();
    if (!hasCredential) {
      return false;
    }

    return true;
  }

  async loginWithBiometric() {
    if (this.biometricLoading) {
      return;
    }

    this.biometricLoading = true;

    try {
      const verified = await this.biometricAuthService.verifyIdentity('Authenticate to login to Evegah');

      if (!verified) {
        this.biometricLoading = false;
        return;
      }

      const storedMobile = await this.biometricAuthService.getMobileNumberFromCredential();

      if (!storedMobile) {
        this.biometricLoading = false;
        this.showAlert('Biometric setup not found. Please login with mobile number once.');
        return;
      }

      const mobileNumber = Number(storedMobile);

      if (!mobileNumber) {
        this.biometricLoading = false;
        this.showAlert('Biometric setup is invalid. Please login with mobile number.');
        return;
      }

      this.mobileNumber = mobileNumber;

      this.subs.add(
        this.sessionService.checkMobileNumber({ mobile_number: mobileNumber }).subscribe({
          next: (res) => {
            if (res.statusCode === 200) {
              const data = res.data[0];
              this.localStorageService.setItem(storageKeyNameConstants.USER_DETAILS, data);
              this.localStorageService.setItem(storageKeyNameConstants.MOBILE_NUMBER, mobileNumber);
              this.localStorageService.setItem(storageKeyNameConstants.USER_ID, data.userId);
              this.localStorageService.setItem(storageKeyNameConstants.OTP_MATCH, true);
              this.localStorageService.setItem(storageKeyNameConstants.REGISTRATION_STATUS, true);
              this.biometricLoading = false;
              this.authService.login();
            } else {
              this.biometricLoading = false;
              this.showAlert(res.message || 'Unable to login with biometrics. Please login manually.');
            }
          },
          error: () => {
            this.biometricLoading = false;
            this.showAlert('Server connection failed. Please try again.');
          }
        })
      );
    } catch {
      this.biometricLoading = false;
      this.showAlert('Biometric login failed. Please login with mobile number.');
    }
  }

  next() {
    if (validateMobileNumber(this.mobileNumber)) {
      this.errorMsg = 'Invalid phone number. Please check again.';
    } else {
      this.isLoading = true;
      this.errorMsg = '';
      this.checkMobileNumber();
    }
  }

  checkMobileNumber() {
    const model = new MobileNumberModel();
    model.mobile_number = this.mobileNumber;

    this.subs.add(
      this.sessionService.checkMobileNumber(model).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            const otp = generateRandomOtp();
            const data = res.data[0];

            this.sessionStorageService.setItem(storageKeyNameConstants.SESSION_OTP, otp);
            this.localStorageService.setItem(storageKeyNameConstants.USER_DETAILS, data);
            this.localStorageService.setItem(storageKeyNameConstants.MOBILE_NUMBER, this.mobileNumber);
            this.localStorageService.setItem(storageKeyNameConstants.USER_ID, data.userId);

            const isUser = res.message !== messageConstants.mobileNumberDoesNotExists;
            this.sessionStorageService.setItem(storageKeyNameConstants.SESSION_IS_USER, isUser);

            this.sendOtpToMobileNumber(otp);
          } else {
            this.isLoading = false;
            this.showAlert(res.message);
          }
        },
        error: () => {
          this.isLoading = false;
          this.showAlert('Server connection failed.');
        }
      })
    );
  }

  sendOtpToMobileNumber(otp: number) {
    if (environment.ACTIVATE_OTP_SERVICE) {
      this.subs.add(
        this.sessionService.sendOtp(this.mobileNumber, otp).subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.Status === 'Success') {
              this.navController.navigateForward('/session/otp', { animated: false, replaceUrl: false });
            } else { this.showAlert(ERROR_IN_SENDING_OTP); }
          },
          error: () => { this.isLoading = false; this.showAlert(ERROR_IN_SENDING_OTP); }
        })
      );
    } else {
      this.isLoading = false;
      this.navController.navigateForward('/session/otp', { animated: false, replaceUrl: false });
    }
  }

  handleEnterKeyEvent(event: any) {
    if (event.keyCode === 13 && this.mobileNumber && !this.isLoading) this.next();
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({ header: 'Evegah', message, buttons: ['OK'] });
    await alert.present();
  }

  navigateMenu(path: string) { this.router.navigate([path]); }

  ngOnDestroy() { this.subs.unsubscribe(); }
}