import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { APPLICATION_VERSION, TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { EnumService } from 'src/app/core/services/enum.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AuthService } from 'src/app/service/auth.service';
import { PaymentService } from '../../core/services/payment.service'
import { AlertController } from '@ionic/angular';
import { VehicleModelService } from 'src/app/core/services/Vehicle-services';
import enumCodeConstants from 'src/app/core/constants/enum-code-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  avatarPreviewUrl: string = '';
  private readonly profileImageStorageKey = 'mobile_profile_avatar_base64';

  pageTitle: string = 'My Account';
  subscription: Subscription[] = [];
  userDetails: any = {};
  userName: any;
  alreadyRegistered = false;
  version = APPLICATION_VERSION;

  public itemChecked: any;
  public log: any;

  constructor(
    public router: Router,
    public PaymentService: PaymentService,
    public toasterService: ToasterService,
    private authService: AuthService,
    private enumService: EnumService,
    private sessionService: SessionService,
    public alertController: AlertController,
    public vehicleModelService: VehicleModelService,
    private localStorageService: LocalStorageService
  ) { }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.avatarPreviewUrl =
      this.localStorageService.getItem(storageKeyNameConstants.USER_AVATAR, true) ||
      localStorage.getItem(this.profileImageStorageKey) ||
      '';
    this.userDetail();
  }

  openPhotoPicker() {
    if (this.photoInput?.nativeElement) {
      this.photoInput.nativeElement.click();
    }
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files && input.files[0] ? input.files[0] : null;

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      this.showAlert('Please select a valid image file.');
      input.value = '';
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      this.showAlert('Please upload an image smaller than 2 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        return;
      }
      this.avatarPreviewUrl = result;
      this.localStorageService.setItem(storageKeyNameConstants.USER_AVATAR, result);
      localStorage.setItem(this.profileImageStorageKey, result);
    };
    reader.readAsDataURL(selectedFile);
  }

  userDetail() {
    this.subscription.push(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe((res) => {
        if (res.statusCode === 200) {
          this.userDetails = res.data[0];
          this.alreadyRegistered = this.userDetails.registrationStatus;
        } else if (res.statusCode === 401) {
          this.authService.logout();
        } else {
          this.showAlert(res.message);
        }
      })
    );
  }

  logoutHandler() {

    this.vehicleModelService.userRideDetails().subscribe((res) => {
      if (res.statusCode === 200) {

        if (Number(res.data[0]?.bikeRidingStatus) === enumCodeConstants.bikeRiding) {
          return this.showAlert('To ensure a smooth experience, please complete your ride before logging out of the application.');
        }

        this.subscription.push(
          this.sessionService.logOutToken().subscribe((res) => {
            this.authService.logout();
          })
        );

      } else {
        this.showAlert(res.message);
        this.authService.logout();
      }
    });

  }

  editProfileHandler() {

    const navigationExtras: NavigationExtras = {
      queryParams: {
        profileData: JSON.stringify(this.userDetails)
      },
    };

    this.router.navigate(['session/basic-info'], navigationExtras);

  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

  async showConfirmationAlert() {

    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Do you really want to logout?',
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
            this.logoutHandler();
          }
        },
      ],
    });

    await alert.present();

  }

  navigateToKYC() {
    this.router.navigate(['home/Kyc']);
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  showDeleteInfo() {
    this.showAlert('Please contact support from Get Help to raise a data deletion request.');
  }

  get mobileDisplay(): string {
    const mobileNumber = this.getValueByKeys(['mobile', 'mobileNo', 'phoneNumber', 'contactNumber']);
    if (mobileNumber) {
      return `${mobileNumber}`;
    }

    const storageMobile = this.localStorageService.getItem(storageKeyNameConstants.MOBILE_NUMBER);
    return storageMobile ? `${storageMobile}` : 'Not Available';
  }

  get dateOfBirthDisplay(): string {
    const dobValue = this.getValueByKeys(['dateOfBirth', 'dob']);
    if (!dobValue) {
      return 'Not Available';
    }

    const dateValue = new Date(dobValue);
    if (Number.isNaN(dateValue.getTime())) {
      return 'Not Available';
    }

    return dateValue.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  get addressDisplay(): string {
    const address = this.getValueByKeys(['address']);
    const city = this.getValueByKeys(['cityName', 'city']);
    const state = this.getValueByKeys(['stateName', 'state']);
    const pinCode = this.getValueByKeys(['pinCode', 'pincode', 'postalCode']);

    const locationParts = [city, state].filter(Boolean).join(', ');
    const fullAddress = [address, locationParts, pinCode].filter(Boolean).join(', ');

    return fullAddress || 'Not Available';
  }

  get walletDisplay(): string {
    const wallet = this.getValueByKeys(['walletAmount', 'walletBalance', 'balance', 'availableBalance']);
    const numberValue = Number(wallet || 0);
    return Number.isFinite(numberValue) ? `INR ${numberValue.toFixed(2)}` : 'INR 0.00';
  }

  get distanceDisplay(): string {
    const distance = this.getValueByKeys(['totalDistance', 'rideDistance', 'distance']);
    const numberValue = Number(distance || 0);
    return Number.isFinite(numberValue) ? `${numberValue.toFixed(3)} km` : '0.000 km';
  }

  get ridesDisplay(): string {
    const rides = this.getValueByKeys(['totalRides', 'rideCount', 'ridesCount']);
    const numberValue = Number(rides || 0);
    return Number.isFinite(numberValue) ? `${Math.max(0, Math.floor(numberValue))}` : '0';
  }

  private getValueByKeys(keys: string[]): any {
    for (const key of keys) {
      if (this.userDetails && this.userDetails[key] !== undefined && this.userDetails[key] !== null) {
        return this.userDetails[key];
      }
    }
    return null;
  }

  backToHome() {
    this.router.navigate(['home']);
  }

  ngOnDestroy() {
    this.userDetails = {};
  }
}
