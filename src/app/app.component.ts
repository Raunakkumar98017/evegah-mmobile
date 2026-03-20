import { Component, ViewChild } from '@angular/core';
import { AuthService } from './service/auth.service';
import { Router } from '@angular/router';
import { IonRouterOutlet, Platform, AlertController } from '@ionic/angular';

import { Subscription } from 'rxjs';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { PaymentService } from '../app/core/services/payment.service';
import { VehicleModelService } from '../app/core/services/Vehicle-services';
import { LocalStorageService } from './core/services/local-storage.service';
import storageKeyNameConstants from './core/constants/storage-keyname-constants';
import { GMapsService } from './core/services/gmaps.services';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  AppName: any;
  subscription: Subscription[] = [];
  displayConfirmationToExit = false;

  @ViewChild(IonRouterOutlet) routerOutlet!: IonRouterOutlet;

  constructor(
    public toasterService: ToasterService,
    private router: Router,
    private platform: Platform,
    public VehicleModel: VehicleModelService,
    private localStorageService: LocalStorageService,
    public alertController: AlertController,
    private gmapsService: GMapsService
  ) {
    this.initializeApp();
    this.platform.backButton.subscribeWithPriority(-1, () => {
      this.exitApp();
    });
  }

  initializeApp() {
    const otpMatched = this.localStorageService.getItem(storageKeyNameConstants.OTP_MATCH);
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    const registrationStatus = this.localStorageService.getItem(storageKeyNameConstants.REGISTRATION_STATUS);

    this.platform.ready().then(() => {
      this.gmapsService.loadGoogleMaps().catch(() => {});
      if (otpMatched === true && registrationStatus === true && userDetails) {
        this.router.navigate(['home']);
      } else {
        this.router.navigateByUrl('session');
      }
    });
  }

  exitApp() {

    if (this.router.url === '/home' || this.router.url === '/session') {
      App.exitApp();
    } else if (
      this.router.url.includes('/home/rideDetails') === true ||
      this.router.url.includes('/home/Wallet') === true ||
      this.router.url.includes('/home/profile') === true
    ) {
      this.router.navigate(['/home']);
    }

  }

  async showConfirmation() {

    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Closing the app? Confirm to exit.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.displayConfirmationToExit = false;
            alert.dismiss();
          }
        },
        {
          text: 'Yes',
          handler: () => {
            App.exitApp();
            alert.dismiss();
          }
        },
      ],
    });

    if (this.displayConfirmationToExit === false) {
      this.displayConfirmationToExit = true;
      await alert.present();
    }

  }


}
