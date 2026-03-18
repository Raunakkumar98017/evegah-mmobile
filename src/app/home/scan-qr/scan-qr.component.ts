import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import { VehicleModelService } from '../../core/services/Vehicle-services'
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { Subscription } from 'rxjs';
import { EnumService } from 'src/app/core/services/enum.service';
import { AuthService } from 'src/app/service/auth.service';

import { PaymentService } from '../../core/services/payment.service';
import { AlertController, LoadingController } from '@ionic/angular';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import messageConstants from 'src/app/core/constants/message-constants';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})

export class ScanQRComponent implements OnInit {
  scanActive = false;
  userDetailForRide: any = {};
  userDetails: any;
  userData: any;
  subscription: Subscription[] = [];
  loading: any;
  enteredLockNumber: any = '';
  deviceenter = false;
  qrString = 'U2FsdGVkX1+J+whsnf9lhyENGQScV9w1QaatxIsG58Lt18J6z+mrvK1epqRDLcTQmNL7IYUFKTtE2QOXPgmo2A==';

  constructor(
    public router: Router,
    private authService: AuthService,
    private enumService: EnumService,
    public VehicleModel: VehicleModelService,
    private PaymentService: PaymentService,
    public activatedRoute: ActivatedRoute,
    public toasterService: ToasterService,
    public alertController: AlertController,
    private loadingCtrl: LoadingController,
    private localStorageService: LocalStorageService
  ) {
  }

  ionViewWillEnter() {
    this.setScannerMode(false);
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.userData = this.userDetails;
    this.userDetail();
  }

  ionViewWillLeave() {
    this.stopScannerSafely();
  }

  ionViewDidLeave() {
    this.setScannerMode(false);
  }

  ngOnInit() { }

  async startScanner() {

    if (Capacitor.isNativePlatform() === false) {
      return;
    }

    const allowed = await this.checkPermission();

    if (allowed) {
      try {
        this.setScannerMode(true);
        await BarcodeScanner.hideBackground();
        await BarcodeScanner.stopScan();

        const result = await BarcodeScanner.startScan();

        if (result.hasContent) {
          if (result.content.includes('encryptQr')) {
            if (Number(this.userDetails.drivingStatusId) === enumCodeConstants.notDrivingStatus) {
              this.scanQRapi(JSON.parse(result.content).encryptQr);
            } else {
              this.showAlert('You are already in a ride');
            }
          } else {
            this.showAlert(messageConstants.invalidQR);
            this.router.navigate(['/home']);
          }
        } else {
          this.showAlert(messageConstants.invalidQR);
          this.router.navigate(['/home']);
        }
      } catch (error: any) {
        const errorMessage = error?.message || error?.error?.message || 'Unable to start camera scanner.';
        this.showAlert(errorMessage);
      } finally {
        await this.stopScannerSafely();
      }
    } else {
      this.router.navigate(['/home']);
    }
  }

  async checkPermission() {
    return new Promise(async (resolve, reject) => {
      try {

        const status = await BarcodeScanner.checkPermission({ force: true });

        if (status.granted) {
          resolve(true);
        } else {
          await this.handleCameraPermissionNotGranted();
          resolve(false);
        }

      } catch (error: any) {
        resolve(false);
      }
    });
  }

  async handleCameraPermissionNotGranted() {

    const alert = await this.alertController.create({
      header: 'Alert',
      message: messageConstants.cameraPermissionMessage,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            alert.dismiss();
          }
        },
        {
          text: 'Open',
          handler: () => {
            BarcodeScanner.openAppSettings();
          }
        },
      ],
    });

    await alert.present();

  }

  scanQRapi(result: any) {

    this.localStorageService.removeItem(storageKeyNameConstants.VEHICLE_QR_DETAILS); // removing old details before scanning new device

    this.subscription.push(
      this.VehicleModel.scanQr(result, this.enteredLockNumber.trim()).subscribe((res) => {
        if (res.statusCode === 200) {
          const _data = res.data[0];

          this.localStorageService.setItem(storageKeyNameConstants.VEHICLE_QR_DETAILS, _data);
          this.localStorageService.removeItem(storageKeyNameConstants.RIDE_STARTED_TIME_IN_MS);
          this.getVehicleDetail(_data);

        } else {
          this.showAlert(res.message);
        }
      }, (exception) => {
        this.showAlert(`Unable to Scan QR: ${exception.error.message}`);
        this.router.navigate(['home']);
      })
    );
  }

  findVehicle() {

    if (!this.enteredLockNumber) {
      return this.showAlert('Please enter Bike Number');
    }

    this.scanQRapi(null);
  }

  getVehicleDetail(vehicleData: any) {

    const stringifiedVehicleData = JSON.stringify(vehicleData);

    this.subscription.push(
      this.VehicleModel.getVehicleDetailServices(stringifiedVehicleData).subscribe((res) => {

        if (res.statusCode === 200) {

          if (+res.data[0].bikeBookedStatus === +enumCodeConstants.bookingStatusReserved) {
            this.showAlert(messageConstants.bikeIsALreadyBookedScanAnother);
            this.router.navigate(['/home'])
          } else {

            if (vehicleData.vehicleId) {
              this.router.navigate(['home/deviceDetails']);
            } else {
              this.showAlert(messageConstants.invalidQR);
              this.router.navigate(['/home']);
            }

          }

        } else {
          this.showAlert(res.message);
          this.router.navigate(['/home']);
        }
      })
    );
  }

  userDetail() {

    this.showLoading();

    this.subscription.push(
      this.enumService.getUserList(this.userData.userId, this.userData.statusEnumId).subscribe((res) => {

        if (res.statusCode === 200) {
          const data = res.data[0];

          if (data.registrationStatus === false) {
            this.router.navigate(['session/basic-info']);
          } else {
            this.userDetails = res.data[0];
            this.getLastRideBookingDetail();
          }

        } else if (res.statusCode === 401) {
          this.authService.logout();
        } else {
          this.showAlert(res.message);
        }

        this.loadingCtrl.dismiss();

      })
    );
  }

  getLastRideBookingDetail() {
    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res?.statusCode === 401) {
        this.safeDismissLoading();
        this.authService.logout();
        return;
      }

      if (res.statusCode === 200) {

        this.loadingCtrl.dismiss();

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {
          this.router.navigate(['home/rideDetails']);
        } else {
          // this.scanQRapi(this.qrString)
          this.startScanner();
        }

      } else {
        this.showAlert(res.message);
        this.router.navigate(['home']);
      }
    }, () => {
      this.safeDismissLoading();
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

  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: 'Fetching user details.....',
      //  duration:3000,
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

  enterById() {
    this.deviceenter = !this.deviceenter;
  }

  ngOnDestroy() {
    this.stopScannerSafely();
    this.safeDismissLoading();
  }

  private setScannerMode(isActive: boolean) {
    this.scanActive = isActive;
    document.body.classList.toggle('scanner-active', isActive);
  }

  private async stopScannerSafely() {
    try {
      await BarcodeScanner.stopScan();
      await BarcodeScanner.showBackground();
    } catch {
      // ignore cleanup errors
    } finally {
      this.setScannerMode(false);
    }
  }

  private async safeDismissLoading() {
    try {
      await this.loadingCtrl.dismiss();
    } catch {
      // no-op when overlay is already dismissed/not created
    }
  }

}
