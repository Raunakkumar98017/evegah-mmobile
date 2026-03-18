/// <reference types="@types/google.maps" />
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { AlertController, ModalController, Platform } from '@ionic/angular';
import { Checkout } from 'capacitor-razorpay';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service';
import { VehicleModelService } from '../../core/services/Vehicle-services';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { EnumService } from 'src/app/core/services/enum.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoadingController } from '@ionic/angular';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { AuthService } from 'src/app/service/auth.service';
import { environment } from 'src/environments/environment';

import { getEnumWallBallanceService } from '../../core/services/getMinWallBal.service';
import intervalPeriodConstants from 'src/app/core/constants/interval-period-constants';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';
import instructionCodeConstant from 'src/app/core/constants/instruction-code-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { RideDetailsModalComponent } from 'src/app/shared/ride-details-modal/ride-details-modal.component';

import { DeviceServices } from 'src/app/core/services/device.services';
import messageConstants from 'src/app/core/constants/message-constants';
import rideDetailsControlTypeConstants from 'src/app/core/constants/ride-details-control-type-constants';

@Component({
  selector: 'app-ride-details',
  templateUrl: './ride-details.component.html',
  styleUrls: ['./ride-details.component.scss'],
})

export class RideDetailsComponent implements OnInit, OnDestroy {

  myLocationIconUrl = '../../../../../assets/images/blue-circle.png';
  //pageTitle = 'Ride Details';
  userDetails: any = null;
  userData: any;
  userDataList: any = {};
  dateTime = new Date();
  time: BehaviorSubject<string> = new BehaviorSubject('00:00');
  timer!: number;
  interval: any;
  address: any;
  RideTime: Date = new Date();
  proceedButton!: boolean;
  data: any;

  subscription: Subscription[] = [];
  vehicleDetails: any = {};
  lockDetails: any;
  modelName: any;
  minimumRentRate: any;
  minHireTime: any;
  firstDetailPage = false;
  secondDetailPage = false;
  thirdDetailPage = false;


  latitude!: number;
  longitude!: number;
  zoom!: number;
  minimumTime = 15;
  battery!: number;
  voltage: any;
  topspeed!: number;
  distanceTraveled!: number;
  amountOnRent!: number;
  counterTimer = false;
  timeRemaining = false;
  minuscount: any = 0;
  totalRent!: number;
  minimumWalletBalance = 0;//it should be 1;
  extraRideCharges!: number;
  firstUserMinimunWalletBalance = 0;  ///
  advanceSecurityDeposite = 0;
  userDetailForRide: any;
  rideBookingId!: number;
  vehicleModelArray: any = [];
  lastRideBookingData: any;
  bikeProduceSetInterval: any;
  lockStatus!: number;
  extraStartTime = 0;
  loading: any;
  loadingImage: any;
  vehicleModelImage: any[] = [];
  defaultImage = false;
  vehicleQRDetails: any = null;
  unlockingRide = false; // loading state
  unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;
  rideTimerInterval!: ReturnType<typeof setInterval>;
  rideTimerCounter: any;
  showTempLockButton = true;
  showUnlockButton = false;
  disableLockUnlockControl = false;
  rideStatusInterval: any;
  autoLockUnlock = true;
  autoLockUnlockAllowed = true;
  rideDetailsControlTypeConstants = rideDetailsControlTypeConstants;
  map: any;
  lightStatus: any = null;
  enumCodeConstants = enumCodeConstants;
  disableLightOnOffControl = false;
  turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;
  bikeLightOnOffSetInterval: any;
  lockTimerInterval!: ReturnType<typeof setInterval>;
  lightTimerInterval!: ReturnType<typeof setInterval>;

  private geoCoder: any;

  constructor(
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public toasterService: ToasterService,
    public PaymentService: PaymentService,
    public VehicleModel: VehicleModelService,
    public platform: Platform,
    private dialog: MatDialog,
    private enumService: EnumService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertController: AlertController,
    private localStorageService: LocalStorageService,
    public WallBallanceService: getEnumWallBallanceService,
    public modalController: ModalController,
    private deviceServices: DeviceServices
  ) {
    this.autoLockUnlockAllowed = environment.DEVICE_AUTO_LOCK_UNLOCK_ALLOWED;
  }

  ionViewWillEnter() {
    this.getVehicleDetail();

    const rideStartTime = this.localStorageService.getItem(storageKeyNameConstants.RIDE_STARTED_TIME_IN_MS);

    if (!rideStartTime) {
      this.getLockStatusOfBike();
    } else {
      const currentTime = Date.now();
      const timeSpentSinceRideStarted = currentTime - (+rideStartTime);
      const rideStartTimeInSeconds = Math.floor(timeSpentSinceRideStarted / 1000);
      this.checkRideStatus();
      this.checkLockStatusOfBike();
      this.startTimer(rideStartTimeInSeconds);
      this.unlockingRide = false;
      this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;
    }

  }

  ngOnInit() {

    this.vehicleQRDetails = this.localStorageService.getItem(storageKeyNameConstants.VEHICLE_QR_DETAILS);
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);

    if (this.vehicleQRDetails === null) {
      this.showAlert(messageConstants.yourAccountHasBeenLoggedOut);
      return this.authService.logout();
    }

    clearInterval(this.bikeProduceSetInterval);

    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.minHireTime = params.minHireTime;
    });
  }

  backToHome() {
    this.router.navigate(['home']);
  }

  handleRideStatusInterval() {

    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        const data = res.data;

        if (data.length > 0 && +data[0]?.bikeRidingStatus === enumCodeConstants.bikeRiding) {

          this.battery = data[0].batteryPercentage;
          this.topspeed = data[0].speed;
          this.latitude = data[0].latitude;
          this.longitude = data[0].longitude;
          this.lightStatus = data[0].deviceLightStatusEnumId;
          this.distanceTraveled = data[0].totalDistanceInKm;

          // identifying lock status (in case if changed by admin)
          if (+data[0].lockStatusId === enumCodeConstants.lock) {
            this.showTempLockButton = false;
            this.showUnlockButton = true;
          } else {
            this.showTempLockButton = true;
            this.showUnlockButton = false;
          }

        } else {
          clearInterval(this.rideStatusInterval);
          clearInterval(this.rideTimerInterval);
          this.showAlert('Your ride has been ended by admin');
          this.router.navigate(['home']);
        }

      } else {
        this.showAlert(res.message);
      }

    });

  }

  checkRideStatus() {

    // invoking the fn for 0th ms,
    // afterwards fn will get invoked after every 'checkingRideStatusIntervalInRideDetails' ms
    this.handleRideStatusInterval();

    this.rideStatusInterval = setInterval(() => {
      this.handleRideStatusInterval();
    }, intervalPeriodConstants.checkingRideStatusIntervalInRideDetails);

  }

  getVehicleDetail() {
    this.subscription.push(
      this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
        if (res.statusCode === 200) {

          this.vehicleDetails = res.data[0];

          this.vehicleDetails.minimumRentRate = Math.round(this.vehicleDetails.minimumRentRate);
          this.lightStatus = this.vehicleDetails.lockDetails[0].deviceLightStatusEnumId || enumCodeConstants.deviceLightOff;
          this.battery = res.data[0].lockDetails[0].battery || 'Data NA';
          this.voltage = Math.round(res.data[0].lockDetails[0].internalBattV) || 'Data NA';
          this.topspeed = res.data[0].lockDetails[0].speed || 'Data NA';
          this.latitude = this.vehicleDetails.lockDetails[0].latitude;
          this.longitude = this.vehicleDetails.lockDetails[0].longitude;

        } else {
          this.showAlert(res.message);
        }
      })
    );
  }

  getLockStatusOfBike() {

    this.unlockingRide = true;

    this.bikeProduceSetInterval = setInterval(() => {

      this.findLockStatusOfBike();

      this.unlockingSeconds -= 3;
      // if unlocking seconds is greater than 120 seconds (2 min), then cancel the ride
      // this check is implemented to handle the case if unlocking the device takes much time
      if (this.unlockingSeconds <= 0) {
        this.handleCancelControlClick(messageConstants.yourRideHasBeenCancelled);
      }

    }, intervalPeriodConstants.getLockUnlockStatusPeriod);
  }

  handleCancelControlClick(cancelAlertMessage?: string) {

    clearInterval(this.bikeProduceSetInterval);
    this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {
          this.unlockingRide = false;
          this.showAlert('Your ride is in progress and cannot be cancelled at this time. Please continue to your destination.');
        } else {
          this.lockVehicle(cancelAlertMessage);
        }

      } else {
        this.showAlert(res.message);
      }
    });

  }

  lockVehicle(cancelAlertMessage?: string) {
    this.subscription.push(
      this.VehicleModel.unLockVehicle(this.vehicleDetails.lockDetails[0].lockNumber, instructionCodeConstant.deviceLock, this.userDetails.userId, this.userDetails.userTypeEnumId).subscribe((res) => {
        if (res.statusCode === 200) {
          this.showAlert(cancelAlertMessage || 'Ride cancelled!');
          this.router.navigate(['home']);
        } else {
          this.showAlert(res.message);
        }
      })
    );

  }

  findLockStatusOfBike() {
    this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
      if (res.statusCode === 200) {
        let lockStatus = Number(res.data[0].lockDetails[0].deviceLockAndUnlockStatus);

        this.vehicleDetails = res.data[0];
        this.deviceUnlock(false);

        if (lockStatus === enumCodeConstants.unlock) {

          clearInterval(this.bikeProduceSetInterval);
          this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

          this.unlockingRide = false;
          this.startRide();
        }

      } else {
        this.showAlert(res.message);
      }
    });
  }

  checkLockStatusOfBike() {
    this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
      if (res.statusCode === 200) {
        let lockStatus = Number(res.data[0].lockDetails[0].deviceLockAndUnlockStatus);

        this.vehicleDetails = res.data[0];

        if (lockStatus === enumCodeConstants.unlock) {
          this.showTempLockButton = true;
          this.showUnlockButton = false;
        } else {
          this.showTempLockButton = false;
          this.showUnlockButton = true;
        }

      } else {
        this.showAlert(res.message);
      }
    });
  }

  startRide() {

    clearInterval(this.rideTimerInterval);

    const rideData = {
      id: this.userDetails.userId,
      bikeId: this.vehicleQRDetails?.bikeId,
      rideBookingMinutes: +this.minHireTime,
      rideStartLatitude: Number(this.vehicleDetails.lockDetails[0].latitude) || this.latitude,
      rideStartLongitude: Number(this.vehicleDetails.lockDetails[0].longitude) || this.longitude
    };

    this.subscription.push(

      this.PaymentService.rideBooking(rideData).subscribe((res) => {
        if (res.statusCode === 200) {
          this.startTimer(0);
          this.checkRideStatus();
          this.localStorageService.setItem(storageKeyNameConstants.RIDE_STARTED_TIME_IN_MS, Date.now());
        } else {
          this.showAlert(res.message);
          this.router.navigate(['home']);
        }
      })
    );
  }

  getPrefix(value: number) {
    const prefix = value < 10 ? '0' : '';
    return prefix;
  }

  startTimer(initialSeconds: number) {
    let globalSeconds: number = initialSeconds;
    let seconds: number = globalSeconds;

    this.rideTimerInterval = setInterval(async () => {
      globalSeconds++;

      const hours = Math.floor(globalSeconds / 3600);
      const minutes = Math.floor(globalSeconds % 3600 / 60);
      seconds = Math.floor(globalSeconds % 3600 % 60);

      if (seconds < 59) {
        seconds++;
      } else {
        seconds = 0;
      }

      this.rideTimerCounter = `${this.getPrefix(minutes)}${minutes}:${this.getPrefix(seconds)}${seconds}`;

      if (hours > 0) {
        this.rideTimerCounter = `${this.getPrefix(hours)}${hours}:${this.getPrefix(minutes)}${minutes}:${this.getPrefix(seconds)}${seconds}`;
      }

    }, 1000);
  }

  temporaryLock() {
    this.disableLockUnlockControl = true;

    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {

          this.subscription.push(
            this.VehicleModel.unLockVehicle(this.vehicleDetails.lockDetails[0].lockNumber, instructionCodeConstant.deviceLock, this.userDetails.userId, this.userDetails.userTypeEnumId).subscribe((res) => {

              if (res.statusCode === 200) {

                this.deviceLock(false);
                this.deviceLightOff(false);

                this.lockTimerInterval = setInterval(() => {
                  this.unlockingSeconds -= 1;
                }, 1000);

                this.bikeProduceSetInterval = setInterval(() => {

                  // fetching vehicle details in definite period
                  this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
                    if (res.statusCode === 200) {
                      let lockStatus = Number(res.data[0].lockDetails[0].deviceLockAndUnlockStatus);
                      let lightStatus = Number(res.data[0].lockDetails[0].deviceLightStatusEnumId);

                      if (lockStatus === enumCodeConstants.lock) {

                        clearInterval(this.bikeProduceSetInterval);
                        clearInterval(this.lockTimerInterval);

                        this.showTempLockButton = false;
                        this.showUnlockButton = true;
                        this.disableLockUnlockControl = false;
                        this.lightStatus = lightStatus;
                        this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                      }

                    } else {
                      this.showAlert(res.message);
                    }
                  });

                  // if unlocking seconds is greater than 1.5min, then cancel the device locking 
                  if (this.unlockingSeconds <= 0) {

                    clearInterval(this.bikeProduceSetInterval);
                    clearInterval(this.lockTimerInterval);

                    this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                    this.subscription.push(
                      this.VehicleModel.unLockVehicle(this.vehicleDetails.lockDetails[0].lockNumber, instructionCodeConstant.deviceUnlock, this.userDetails.userId, this.userDetails.userTypeEnumId).subscribe((res) => {
                        if (res.statusCode === 200) {
                          this.deviceUnlock(true);
                          this.showTempLockButton = true;
                          this.showUnlockButton = false;
                          this.disableLockUnlockControl = false;
                          this.showAlert(messageConstants.unableToTemporaryLockYourRide);
                        } else {
                          this.showAlert(res.message);
                        }
                      })
                    );

                  }

                }, intervalPeriodConstants.getLockUnlockStatusPeriod);

              } else {
                this.showAlert(res.message);
              }

            })
          );

        } else {
          this.showAlert("Lock/Unlock Unavailable: You can't change the vehicle's lock/unlock status as there is no active ride.");
        }

      } else {
        this.showAlert(res.message);
      }
    });


  }

  unlockRide() {

    this.disableLockUnlockControl = true;

    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {

          this.subscription.push(
            this.VehicleModel.unLockVehicle(this.vehicleDetails.lockDetails[0].lockNumber, instructionCodeConstant.deviceUnlock, this.userDetails.userId, this.userDetails.userTypeEnumId).subscribe((res) => {

              if (res.statusCode === 200) {

                this.deviceUnlock(false);

                this.lockTimerInterval = setInterval(() => {
                  this.unlockingSeconds -= 1;
                }, 1000);

                this.bikeProduceSetInterval = setInterval(() => {

                  // fetching vehicle details in definite period
                  this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
                    if (res.statusCode === 200) {
                      let lockStatus = Number(res.data[0].lockDetails[0].deviceLockAndUnlockStatus);
                      let lightStatus = Number(res.data[0].lockDetails[0].deviceLightStatusEnumId);

                      if (lockStatus === enumCodeConstants.unlock) {

                        clearInterval(this.bikeProduceSetInterval);
                        clearInterval(this.lockTimerInterval);

                        this.showTempLockButton = true;
                        this.showUnlockButton = false;
                        this.disableLockUnlockControl = false;
                        this.lightStatus = lightStatus;
                        this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                      }

                    } else {
                      this.showAlert(res.message);
                    }
                  });

                  // if unlocking seconds is greater than 1.5min, then cancel the device unlocking 
                  if (this.unlockingSeconds <= 0) {

                    clearInterval(this.bikeProduceSetInterval);
                    clearInterval(this.lockTimerInterval);

                    this.unlockingSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                    this.subscription.push(
                      this.VehicleModel.unLockVehicle(this.vehicleDetails.lockDetails[0].lockNumber, instructionCodeConstant.deviceLock, this.userDetails.userId, this.userDetails.userTypeEnumId).subscribe((res) => {
                        if (res.statusCode === 200) {
                          this.deviceLock(true);
                          this.showTempLockButton = false;
                          this.showUnlockButton = true;
                          this.disableLockUnlockControl = false;
                          this.showAlert(messageConstants.unableToUnlockYourRide);
                        } else {
                          this.showAlert(res.message);
                        }
                      })
                    );

                  }

                }, intervalPeriodConstants.getLockUnlockStatusPeriod);

              } else {
                this.showAlert(res.message);
              }

            })
          );

        } else {
          this.showAlert("Lock/Unlock Unavailable: You can't change the vehicle's lock/unlock status as there is no active ride.");
        }

      } else {
        this.showAlert(res.message);
      }
    });

  }

  endRide() {

    this.showLoading('Ending your ride...');

    this.VehicleModel.userRideDetails().subscribe((res) => {
      this.rideBookingId = res.data[0].rideBookingId;
      const bikeRidingStatus = res.data[0].bikeRidingStatus;

      if (!this.rideBookingId) {
        return this.showAlert("You can't end ride for now.");
      }

      if (+bikeRidingStatus !== +enumCodeConstants.bikeRiding) {
        this.router.navigate(['home']);
        return this.showAlert("Your ride had been already ended.");
      }

      const params = {
        rideBookingId: this.rideBookingId,
        id: this.userDetails.userId,
        rideEndLatitude: this.vehicleDetails.lockDetails[0].latitude,
        rideEndLongitude: this.vehicleDetails.lockDetails[0].longitude,
        remarks: "",
        endRideUserId: this.userDetails.userId
      };

      this.subscription.push(
        this.PaymentService.updateDetailsRideEnds(params).subscribe((res) => {
          if (res.statusCode === 200) {

            this.localStorageService.removeItem(storageKeyNameConstants.RIDE_STARTED_TIME_IN_MS);
            this.localStorageService.removeItem(storageKeyNameConstants.VEHICLE_QR_DETAILS);

            this.clearAllIntervals();

            this.loadingCtrl.dismiss();

            this.showRideDetailsModal(res.data[0]);

          } else {
            this.showAlert(res.message);
          }
        }));

    })

  }

  handleLightToggleControlClick() {

    this.showConfirmationAlert(
      +this.lightStatus === enumCodeConstants.deviceLightOff ?
        rideDetailsControlTypeConstants.LIGHT_ON :
        rideDetailsControlTypeConstants.LIGHT_OFF
    );

  }

  turnOnDeviceLight() {

    this.disableLightOnOffControl = true;

    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {

          this.subscription.push(
            this.VehicleModel.turnOnDeviceLight(this.vehicleDetails.lockDetails[0].lockNumber, this.userDetails.userId).subscribe((res) => {

              if (res.statusCode === 200) {

                this.deviceLightOn(false);

                this.lightTimerInterval = setInterval(() => {
                  this.turningLightOnOffSeconds -= 1;
                }, 1000);

                this.bikeLightOnOffSetInterval = setInterval(() => {

                  // fetching vehicle details in definite period
                  this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
                    if (res.statusCode === 200) {

                      let lightStatus = Number(res.data[0].lockDetails[0].deviceLightStatusEnumId);

                      if (lightStatus === enumCodeConstants.deviceLightOn) {

                        clearInterval(this.bikeLightOnOffSetInterval);
                        clearInterval(this.lightTimerInterval);

                        this.disableLightOnOffControl = false;
                        this.lightStatus = lightStatus;
                        this.turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;
                      }

                    } else {
                      this.showAlert(res.message);
                      this.disableLightOnOffControl = false;
                    }
                  });

                  // if turningLightOnOffSeconds is greater than 1.5min, then cancel the turning light on
                  if (this.turningLightOnOffSeconds <= 0) {

                    clearInterval(this.bikeLightOnOffSetInterval);
                    clearInterval(this.lightTimerInterval);

                    this.turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                    this.subscription.push(
                      this.VehicleModel.turnOffDeviceLight(this.vehicleDetails.lockDetails[0].lockNumber, this.userDetails.userId).subscribe((res) => {
                        if (res.statusCode === 200) {
                          this.deviceLightOff(true);
                          this.disableLightOnOffControl = false;
                          this.showAlert(messageConstants.unableToTurnOnVehicleLight);
                        } else {
                          this.showAlert(res.message);
                          this.disableLightOnOffControl = false;
                        }
                      })
                    );

                  }

                }, intervalPeriodConstants.getLightOnOffStatusPeriod)

              } else {
                this.showAlert(res.message);
                this.disableLightOnOffControl = false;
              }

            })
          );

        } else {
          this.showAlert(messageConstants.canNotTurnOnOffTheLight);
          this.disableLightOnOffControl = false;
        }

      } else {
        this.showAlert(res.message);
        this.disableLightOnOffControl = false;
      }
    });

  }

  turnOffDeviceLight() {

    this.disableLightOnOffControl = true;

    this.VehicleModel.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {

          this.subscription.push(
            this.VehicleModel.turnOffDeviceLight(this.vehicleDetails.lockDetails[0].lockNumber, this.userDetails.userId).subscribe((res) => {

              if (res.statusCode === 200) {

                this.deviceLightOff(false);

                this.lightTimerInterval = setInterval(() => {
                  this.turningLightOnOffSeconds -= 1;
                }, 1000);

                this.bikeLightOnOffSetInterval = setInterval(() => {

                  // fetching vehicle details in definite period
                  this.VehicleModel.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe((res) => {
                    if (res.statusCode === 200) {

                      let lightStatus = Number(res.data[0].lockDetails[0].deviceLightStatusEnumId);

                      if (lightStatus === enumCodeConstants.deviceLightOff) {

                        clearInterval(this.bikeLightOnOffSetInterval);
                        clearInterval(this.lightTimerInterval);

                        this.disableLightOnOffControl = false;
                        this.lightStatus = lightStatus;
                        this.turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                      }

                    } else {
                      this.showAlert(res.message);
                      this.disableLightOnOffControl = false;
                    }
                  });

                  // if turningLightOnOffSeconds is greater than 1min, then cancel the turning light on
                  if (this.turningLightOnOffSeconds <= 0) {

                    clearInterval(this.bikeLightOnOffSetInterval);
                    clearInterval(this.lightTimerInterval);

                    this.turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;

                    this.subscription.push(
                      this.VehicleModel.turnOnDeviceLight(this.vehicleDetails.lockDetails[0].lockNumber, this.userDetails.userId).subscribe((res) => {
                        if (res.statusCode === 200) {
                          this.deviceLightOn(true);
                          this.disableLightOnOffControl = false;
                          this.showAlert(messageConstants.unableToTurnOffVehicleLight);
                        } else {
                          this.showAlert(res.message);
                          this.disableLightOnOffControl = false;
                        }
                      })
                    );

                  }

                }, intervalPeriodConstants.getLightOnOffStatusPeriod)

              } else {
                this.showAlert(res.message);
                this.disableLightOnOffControl = false;
              }

            })
          );

        } else {
          this.showAlert(messageConstants.canNotTurnOnOffTheLight);
        }

      } else {
        this.showAlert(res.message);
      }
    });

  }

  handleAutoLockUnlockChange() {
    this.autoLockUnlock = !this.autoLockUnlock;
  }

  deviceLock(skipCheck: boolean) {

    if (this.autoLockUnlockAllowed === false) {
      return;
    }

    if (this.autoLockUnlock === false) {
      return;
    }

    const lockNumber = this.vehicleDetails?.lockDetails[0]?.lockNumber;

    this.deviceServices.lockVehicle(lockNumber).subscribe((res) => {
      if (res.statusCode !== 200) {
        this.showAlert(`Error while locking the device: ${res.message}`);
        clearInterval(this.bikeProduceSetInterval);
      }
    });
  }

  deviceUnlock(skipCheck: boolean) {

    if (skipCheck === false && this.autoLockUnlockAllowed === false) {
      return;
    }

    if (skipCheck === false && this.autoLockUnlock === false) {
      return;
    }

    const lockNumber = this.vehicleDetails?.lockDetails[0]?.lockNumber;

    this.deviceServices.unlockVehicle(lockNumber).subscribe((res) => {
      if (res.statusCode !== 200) {
        this.showAlert(`Error while unlocking the device: ${res.message}`);
        clearInterval(this.bikeProduceSetInterval);
      }
    });

  }

  deviceLightOn(skipCheck: boolean) {

    if (skipCheck === false && this.autoLockUnlockAllowed === false) {
      return;
    }

    if (skipCheck === false && this.autoLockUnlock === false) {
      return;
    }

    const lockNumber = this.vehicleDetails?.lockDetails[0]?.lockNumber;

    this.deviceServices.deviceLightOn(lockNumber).subscribe((res) => {
      if (res.statusCode !== 200) {
        this.showAlert(`Error while turning light on/off: ${res.message}`);
        clearInterval(this.bikeLightOnOffSetInterval);
        this.turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;
      }
    });

  }

  deviceLightOff(skipCheck: boolean) {

    if (skipCheck === false && this.autoLockUnlockAllowed === false) {
      return;
    }

    if (skipCheck === false && this.autoLockUnlock === false) {
      return;
    }

    const lockNumber = this.vehicleDetails?.lockDetails[0]?.lockNumber;

    this.deviceServices.deviceLightOff(lockNumber).subscribe((res) => {
      if (res.statusCode !== 200) {
        this.showAlert(`Error while turning light on/off: ${res.message}`);
        clearInterval(this.bikeLightOnOffSetInterval);
        this.turningLightOnOffSeconds = intervalPeriodConstants.defaultLockUnlockTimePeriod;
      }
    });

  }

  handleConfirmationAlertYesControl(type: string) {

    if (type === rideDetailsControlTypeConstants.END_RIDE) {
      return this.endRide();
    }

    if (type === rideDetailsControlTypeConstants.TEMP_LOCK) {
      return this.temporaryLock();
    }

    if (type === rideDetailsControlTypeConstants.UNLOCK) {
      return this.unlockRide();
    }

    if (type === rideDetailsControlTypeConstants.LIGHT_OFF) {
      return this.turnOffDeviceLight();
    }

    return this.turnOnDeviceLight();
  }

  async showConfirmationAlert(type: string) {

    let message = messageConstants.wantToEndRide;

    if (type === rideDetailsControlTypeConstants.TEMP_LOCK) {
      message = messageConstants.wantToTempLock;
    }

    if (type === rideDetailsControlTypeConstants.UNLOCK) {
      message = messageConstants.wantToUnlock;
    }

    if (type === rideDetailsControlTypeConstants.LIGHT_OFF) {
      message = messageConstants.wantToTurnOffLight;
    }

    if (type === rideDetailsControlTypeConstants.LIGHT_ON) {
      message = messageConstants.wantToTurnOnLight;
    }

    const alert = await this.alertController.create({
      header: 'Confirm',
      message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            alert.dismiss();
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.handleConfirmationAlertYesControl(type);
          }
        },
      ],
    });

    await alert.present();

  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

  async showLoading(message?: string) {
    this.loading = await this.loadingCtrl.create({
      message: message ? message : 'Fetching ride details...',
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

  async showRideDetailsModal(data: any) {

    const modal = await this.modalController.create({
      component: RideDetailsModalComponent,
      backdropDismiss: false,
      componentProps: {
        rideDetails: data,
        rideBookingId: this.rideBookingId
      }
    });

    return await modal.present();
  }

  clearAllIntervals() {
    clearInterval(this.rideTimerInterval);
    clearInterval(this.bikeProduceSetInterval);
    clearInterval(this.rideStatusInterval);
    clearInterval(this.bikeLightOnOffSetInterval);
    clearInterval(this.lockTimerInterval);
    clearInterval(this.lightTimerInterval);
  }

  ngOnDestroy(): void {
    this.clearAllIntervals();
    this.modalController.dismiss();
  }

}
