/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Component, OnInit, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { ERROR_IN_SENDING_OTP, INCORRECT_OTP } from 'src/app/core/constants/message-constant';
import { generateRandomOtp } from 'src/app/core/helper/common-helper';
import { SessionService } from 'src/app/core/services/session.service';
import { SpinnerService } from 'src/app/core/services/spinner.services';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AuthService } from '../../service/auth.service';
import { Keyboard } from '@capacitor/keyboard';
import { environment } from 'src/environments/environment';
import { EnumService } from 'src/app/core/services/enum.service';
import { AlertController } from '@ionic/angular';
import { SessionStorageService } from 'src/app/core/services/session-storage.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import messageConstants from 'src/app/core/constants/message-constants';
import { NgOtpInputComponent } from 'ng-otp-input';
import { BiometricAuthService } from 'src/app/core/services/biometric-auth.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
})
export class OtpComponent implements OnInit, OnDestroy {

  @ViewChild(NgOtpInputComponent, { static: false }) ngOtpInputReference!: NgOtpInputComponent;

  mobileNumber!: number;
  otp: any;
  isUser!: boolean;
  userDetails!: any;
  registrationStatus!: boolean;
  counter: any;
  // enteredOtp = {
  //   first: '',
  //   second: '',
  //   third: '',
  //   fourth: '',
  // };
  enteredOTP = '';
  errorMsg: string = '';
  subscription: Subscription[] = [];
  envData: any = environment;
  showOtp!: boolean;
  enterOTPAttemptRemains: number = 3;
  alreadyResendOTP: boolean = false;
  timerInterval!: ReturnType<typeof setInterval>;
  disableContinueControl = true;

  constructor(
    public router: Router,
    private enumService: EnumService,
    private sessionService: SessionService,
    public toasterService: ToasterService,
    private authService: AuthService,
    public spinnerService: SpinnerService,
    public alertController: AlertController,
    private sessionStorageService: SessionStorageService,
    private localStorageService: LocalStorageService,
    private biometricAuthService: BiometricAuthService
  ) {
    this.timer(2); // 2 as parameter designates the minute
  }

  ionViewWillEnter() {
    // this.enteredOtp.first = '';
    // this.enteredOtp.second = '';
    // this.enteredOtp.third = '';
    // this.enteredOtp.fourth = '';
    this.mobileNumber = this.localStorageService.getItem(storageKeyNameConstants.MOBILE_NUMBER);
    this.otp = this.sessionStorageService.getItem(storageKeyNameConstants.SESSION_OTP);
    this.isUser = this.sessionStorageService.getItem(storageKeyNameConstants.SESSION_IS_USER);

    if (this.isUser === true) {
      this.registrationStatus = true;
    }
  }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);

    if (typeof this.userDetails?.registrationStatus === 'boolean') {
      this.registrationStatus = this.userDetails.registrationStatus;
      this.localStorageService.setItem(storageKeyNameConstants.REGISTRATION_STATUS, this.registrationStatus);
    }

    if (environment.ACTIVATE_OTP_SERVICE) {
      this.showOtp = false;
    } else {
      this.showOtp = true;
    }

  }

  // this function use to back on previous page
  backBtn() {
    this.router.navigate(['../session']);
  }

  //this function use to navigate next page
  proceed() {

    if (Number(this.otp) === Number(this.enteredOTP)) {

      this.localStorageService.setItem(storageKeyNameConstants.OTP_MATCH, true);
      clearInterval(this.timerInterval);

      this.errorMsg = '';

      if (this.isUser) {
        this.localStorageService.setItem(storageKeyNameConstants.REGISTRATION_STATUS, true);
        this.enableBiometricLoginIfNeeded().finally(() => {
          this.authService.login();
        });
      } else {
        this.router.navigate(['../session/basic-info']);
        this.sessionStorageService.removeItem(storageKeyNameConstants.SESSION_OTP);
      }

    } else {
      this.handleInvalidOTPAttempts();
    }
  }

  onOtpChange(value: any) {
    this.enteredOTP = value;

    if (this.counter === '00:00' || this.enteredOTP?.length < 4) {
      this.disableContinueControl = true;
    } else {
      this.disableContinueControl = false;
    }

  }

  // emptyOTPFields(firstField: any) {
  //   this.enteredOtp.first = '';
  //   this.enteredOtp.second = '';
  //   this.enteredOtp.third = '';
  //   this.enteredOtp.fourth = '';
  //   firstField?.setFocus();
  // }

  handleInvalidOTPAttempts() {

    this.enterOTPAttemptRemains--;

    this.localStorageService.setItem(storageKeyNameConstants.OTP_MATCH, false);
    // this.emptyOTPFields(firstField);
    this.setOTPControlValue('');

    if (this.enterOTPAttemptRemains === 0) {
      this.router.navigate(['../session']);
      return this.showAlert(messageConstants.maximumOTPAttemptsReached);
    }

    this.showAlert(messageConstants.invalidOTP);

  }



  setOTPControlValue(value: string) {
    this.ngOtpInputReference.setValue(value);
  }

  resendOtp() {

    this.alreadyResendOTP = true;
    this.enterOTPAttemptRemains = 3;
    this.timer(2);
    // this.enteredOtp.first = '';
    // this.enteredOtp.second = '';
    // this.enteredOtp.third = '';
    // this.enteredOtp.fourth = '';
    this.setOTPControlValue('');

    const generatedOtp = generateRandomOtp();
    this.otp = generatedOtp;

    this.sessionStorageService.setItem(storageKeyNameConstants.SESSION_OTP, this.otp);

    if (environment.ACTIVATE_OTP_SERVICE) {
      this.sessionService.sendOtp(this.mobileNumber, generatedOtp).subscribe((res) => {
        if (res.Status !== 'Success') {
          this.showAlert(ERROR_IN_SENDING_OTP);
        }
      })
    }

  }

  handleEnterKeyEvent(event: any) {

    const keyCode = event.keyCode;

    if (keyCode !== 13) {
      return;
    }

    if (this.enteredOTP.length !== 4) {
      return;
    }

    this.proceed();

  }

  // validateOTPField(value: any) {

  //   // otp number may contain 0, so assume 0 as valid entity
  //   if (value === 0) {
  //     return true;
  //   }

  //   // any falsy value treated as invalid entity
  //   if (!value) {
  //     return false;
  //   }

  //   return true;

  // }

  // function to manage the otp input fields focus
  // moveFocus(event: any, nextElement: any, previousElement: any) {

  //   // if backspace control get pressed
  //   if (event.keyCode === 8 && previousElement) {
  //     previousElement.setFocus();
  //   } else if (
  //     // if 0-9 & numpad 0-9 controls get pressed 
  //     ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105)) &&
  //     nextElement
  //   ) {
  //     nextElement.setFocus();
  //   } else if (event.keyCode === 13) {
  //     Keyboard.hide();
  //   }

  //   // updating disable otp fields flag
  //   if (
  //     (this.enteredOTP && this.enteredOTP.length === 4) ||
  //     this.counter === '00:00'
  //   ) {
  //     this.disableContinueControl = true;
  //   } else {
  //     this.disableContinueControl = false;
  //   }

  //   if (event.keyCode === 13 && this.disableContinueControl === false) {
  //     this.proceed();
  //   }

  // }

  timer(minute: number) {
    let seconds: number = minute * 60;
    let textSec: any = '0';
    let statSec = 60;

    const prefix = minute < 10 ? '0' : '';

    this.timerInterval = setInterval(async () => {
      seconds--;
      if (statSec !== 0) {
        statSec--;
      } else {
        statSec = 59;
      }

      if (statSec < 10) {
        textSec = '0' + statSec;
      } else {
        textSec = statSec;
      }

      this.counter = `${prefix}${Math.floor(seconds / 60)}:${textSec}`;

      // if otp has already been resent and counter again timed out
      // navigate user to mobile number page
      if (this.alreadyResendOTP === true && this.counter === '00:00') {
        await this.showAlert(messageConstants.otpEntryHasExpired);
        this.router.navigate(['../session']);
      }

      if (seconds === 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  userDetail() {
    if (!this.userDetails?.userId || !this.userDetails?.statusEnumId) {
      return;
    }

    this.subscription.push(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe((res) => {
        if (res.statusCode === 200) {
          this.registrationStatus = res.data[0].registrationStatus;
          this.localStorageService.setItem(storageKeyNameConstants.REGISTRATION_STATUS, this.registrationStatus);
        } else if (res.statusCode !== 401) {
          this.showAlert(res.message);
        }

      })
    );
  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

  private async enableBiometricLoginIfNeeded(): Promise<void> {
    const mobile = this.localStorageService.getItem(storageKeyNameConstants.MOBILE_NUMBER);

    if (!mobile) {
      return;
    }

    const isAvailable = await this.biometricAuthService.isAvailable();

    if (!isAvailable) {
      return;
    }

    const alreadyEnabled = this.localStorageService.getItem(storageKeyNameConstants.BIOMETRIC_LOGIN_ENABLED, true);
    if (alreadyEnabled === true) {
      return;
    }

    const enablePrompt = await this.alertController.create({
      header: 'Enable Biometric Login?',
      message: 'Use fingerprint or face unlock for faster login next time.',
      buttons: [
        {
          text: 'Not now',
          role: 'cancel'
        },
        {
          text: 'Enable',
          handler: async () => {
            const enabled = await this.biometricAuthService.saveCredential(`${mobile}`);
            if (enabled) {
              this.localStorageService.setItem(storageKeyNameConstants.BIOMETRIC_LOGIN_ENABLED, true);
            }
          }
        }
      ]
    });

    await enablePrompt.present();
    await enablePrompt.onDidDismiss();
  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
    clearInterval(this.timerInterval);
  }

}
