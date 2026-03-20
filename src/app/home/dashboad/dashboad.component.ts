/// <reference types="@types/google.maps" />
import { ToasterService } from 'src/app/core/services/toaster.service';
import { zoneService } from 'src/app/core/services/zone.services';
import { Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';

import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/service/auth.service';
import { EnumService } from 'src/app/core/services/enum.service';
import { PaymentService } from '../../core/services/payment.service';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { SessionStorageService } from 'src/app/core/services/session-storage.service';
import { StateManagementService } from 'src/app/core/services/stateManagement.service';
import { VehicleModelService } from 'src/app/core/services/Vehicle-services';
import intervalPeriodConstants from 'src/app/core/constants/interval-period-constants';
import { GMapsService } from 'src/app/core/services/gmaps.services';
import { LocationService } from 'src/app/core/services/location.service';
@Component({
  selector: 'app-dashboad',
  templateUrl: './dashboad.component.html',
  styleUrls: ['./dashboad.component.scss'],
})

export class DashboadComponent implements OnInit {

  @ViewChild('homePageMapReference', { static: true }) mapElementRef!: ElementRef;

  userDetails: any;
  inputValue = "mahima";
  subscription: Subscription[] = [];
  showContinueToRideControl = false;
  lastRideDetails: any;
  showSearchControl = false;
  rideBookingDetailsInterval: any;
  deviceCoordinates: any = null;

  constructor(
    public toasterService: ToasterService,
    public router: Router,
    public zoneServices: zoneService,
    public toastr: ToasterService,
    private authService: AuthService,
    public vehicleService: VehicleModelService,
    public localStorageService: LocalStorageService,
    private sessionStorageService: SessionStorageService,
    private stateManagementService: StateManagementService,
    private gmapsService: GMapsService,
    private locationService: LocationService
  ) { }

  ionViewWillEnter() {
    const otpMatched = this.localStorageService.getItem(storageKeyNameConstants.OTP_MATCH);

    if (otpMatched === true || otpMatched === null) {
      this.getRideBookingDetail();
    }

    if (otpMatched === false) {
      this.sessionStorageService.clearStorage();
      this.authService.logout();
    }

  }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.locationService.init();
    this.gmapsService.loadGoogleMaps().catch(() => { });
  }

  navigateQr() {
    this.router.navigate(['/home/ScanQR']);
  }

  handleRideDetailsBookingInterval() {

    this.subscription.push(
      this.vehicleService.userRideDetails().subscribe((res) => {

        if (res?.statusCode === 401) {
          clearInterval(this.rideBookingDetailsInterval);
          this.showContinueToRideControl = false;
          this.authService.logout();
          return;
        }

        if (res.statusCode === 200) {

          if (res.data.length > 0 && Number(res.data[0].bikeRidingStatus) === enumCodeConstants.bikeRiding) {

            this.lastRideDetails = res.data[0];
            this.showContinueToRideControl = true;

            this.deviceCoordinates = {
              latitude: this.lastRideDetails.latitude,
              longitude: this.lastRideDetails.longitude
            };

          } else {

            clearInterval(this.rideBookingDetailsInterval);

            this.showContinueToRideControl = false;
            // this.router.navigate(['home']);

            this.localStorageService.removeItem(storageKeyNameConstants.RIDE_STARTED_TIME_IN_MS);
            this.localStorageService.removeItem(storageKeyNameConstants.VEHICLE_QR_DETAILS);

          }

        } else {
          this.toasterService.presentToast(
            res.message,
            TOASTER_CONSTANTS.WARNING
          );
        }
      }, () => {
        clearInterval(this.rideBookingDetailsInterval);
      })
    );

  }

  getRideBookingDetail() {
    if (this.localStorageService.getItem(storageKeyNameConstants.REGISTRATION_STATUS)) {
      const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true) || {};
      const accessToken = userDetails?.access_token || userDetails?.accessToken || userDetails?.token;
      const userId = userDetails?.userId || userDetails?.id;

      if (!accessToken || !userId) {
        clearInterval(this.rideBookingDetailsInterval);
        this.authService.logout();
        return;
      }

      clearInterval(this.rideBookingDetailsInterval);

      // invoking the fn for 0th ms,
      // afterwards fn will get invoked after every 'currentLocationUpdateInterval' ms
      this.handleRideDetailsBookingInterval();

      this.rideBookingDetailsInterval = setInterval(() => {
        this.handleRideDetailsBookingInterval();
      }, intervalPeriodConstants.currentLocationUpdateInterval
      );

    }
  }

  continueToRide() {

    const vehicleQRDetails = {
      bikeId: this.lastRideDetails.bikeId,
      lockId: this.lastRideDetails.lockId,
      uId: this.lastRideDetails.uId,
      userId: this.lastRideDetails.id,
      vehicleId: this.lastRideDetails.vehicleId
    };
    const rideStartedTime = new Date(this.lastRideDetails.fromRideTime).getTime();

    this.localStorageService.setItem(storageKeyNameConstants.VEHICLE_QR_DETAILS, vehicleQRDetails);
    this.localStorageService.setItem(storageKeyNameConstants.RIDE_STARTED_TIME_IN_MS, rideStartedTime);

    this.router.navigate(['home/rideDetails']);

  }

  handleSearchControlClick() {
    this.showSearchControl = this.stateManagementService.showSearchboxOnMap;
  }

}

