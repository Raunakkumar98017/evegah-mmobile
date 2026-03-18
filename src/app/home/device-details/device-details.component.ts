import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { register } from 'swiper/element/bundle';

import { PaymentService } from '../../core/services/payment.service';
import { VehicleModelService } from '../../core/services/Vehicle-services';
import { EnumService } from 'src/app/core/services/enum.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/service/auth.service';

import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import intervalPeriodConstants from 'src/app/core/constants/interval-period-constants';
import messageConstants from 'src/app/core/constants/message-constants';
import instructionCodeConstant from 'src/app/core/constants/instruction-code-constants';

register();

@Component({
  selector: 'app-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss']
})
export class DeviceDetailsComponent implements OnInit, OnDestroy {
  private subs = new Subscription();
  readonly defaultVehicleImagePath = '../../../assets/images/evegah-bike.jpg';
  
  userDetails: any = null;
  vehicleQRDetails: any = null;
  vehicleDetails: any = {};
  
  // UI Display Variables
  modelName: string = '';
  minimumRentRate: any;
  minHireTime: any;
  battery: any;
  maxRange: any;
  walletBalance: any;
  deviceStatus: string = '';
  
  vehicleModelImage: any[] = [];
  vehicleSliderImages: any[] = [];
  defaultImage: boolean = false;
  zoomedImageUrl: string | null = null;

  // Timer Variables
  beforeRideTimerInterval: any;
  timeSpentBeforeBookingRide = intervalPeriodConstants.timeBeforeBookingRide - 1;
  timeSpentBeforeBookingRideValue: string = '00:00';

  constructor(
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public paymentService: PaymentService,
    public vehicleModelService: VehicleModelService,
    private loadingCtrl: LoadingController,
    public alertController: AlertController,
    private localStorageService: LocalStorageService,
    public authService: AuthService,
    private enumService: EnumService
  ) {}

  ionViewWillEnter() {
    this.fetchData();
  }

  ngOnInit() {
    this.vehicleQRDetails = this.localStorageService.getItem(storageKeyNameConstants.VEHICLE_QR_DETAILS);
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);

    if (!this.vehicleQRDetails) {
      this.showAlert(messageConstants.yourAccountHasBeenLoggedOut);
      this.authService.logout();
    }
  }

  private fetchData() {
    this.getUserDetails();
    this.getVehicleDetail();
  }

  getUserDetails() {
    this.subs.add(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.walletBalance = res.data[0].walletAmount;
          }
        }
      })
    );
  }

  async getVehicleDetail() {
    const loader = await this.loadingCtrl.create({
      message: 'Accessing Vehicle Data...',
      cssClass: 'loader-css-class',
    });
    await loader.present();

    this.subs.add(
      this.vehicleModelService.getVehicleDetailServices(JSON.stringify(this.vehicleQRDetails)).subscribe({
        next: (res) => {
          loader.dismiss();
          if (res.statusCode === 200) {
            const data = res.data[0];
            this.vehicleDetails = data;
            this.processVehicleData(data);
            this.startTimer();
          } else {
            this.showAlert(res.message);
          }
        },
        error: () => loader.dismiss()
      })
    );
  }

  private processVehicleData(data: any) {
    this.modelName = data.modelName;
    this.deviceStatus = data.lockDetails[0]?.deveiceState || "Online";
    this.battery = data.lockDetails[0]?.battery || 0;
    this.maxRange = data.maxRangeOn100PercentageBatteryKM || 0;
    this.minimumRentRate = data.farePlanData[0]?.todaysRate || 0;
    this.minHireTime = data.farePlanData[0]?.minimumHireMinuts || 0;

    const sourceImages = this.normalizeVehicleImageSource(this.getVehicleImageSource(data));
    if (sourceImages.length === 0) {
      this.vehicleModelImage = [];
      this.vehicleSliderImages = [];
      this.defaultImage = true;
      return;
    }

    this.vehicleModelImage = [...sourceImages]
      .sort((a: any, b: any) => (a.imageSerialNumber || 0) - (b.imageSerialNumber || 0))
      .map((image: any) => ({
        ...image,
        resolvedImageUrl: this.resolveVehicleImageUrl(image)
      }))
      .filter((image: any) => !!image.resolvedImageUrl);

    this.vehicleSliderImages = this.vehicleModelImage.slice(0, 3);
    this.defaultImage = this.vehicleSliderImages.length === 0;
  }

  getVehicleImageUrl(image: any): string {
    return image?.resolvedImageUrl || this.defaultVehicleImagePath;
  }

  onVehicleImageError(event: Event, image: any) {
    const htmlImageElement = event.target as HTMLImageElement | null;
    if (!htmlImageElement) {
      return;
    }

    const uploadPathCandidates = this.buildUploadImageCandidates(image?.image_unique_name || image?.image_name);
    const fallbackAttemptIndex = Number(htmlImageElement.getAttribute('data-fallback-index') || 0);
    const nextFallbackUrl = uploadPathCandidates[fallbackAttemptIndex];

    if (nextFallbackUrl && htmlImageElement.src !== nextFallbackUrl) {
      htmlImageElement.setAttribute('data-fallback-index', String(fallbackAttemptIndex + 1));
      htmlImageElement.src = nextFallbackUrl;
      image.resolvedImageUrl = nextFallbackUrl;
      return;
    }

    htmlImageElement.src = this.defaultVehicleImagePath;
    image.resolvedImageUrl = this.defaultVehicleImagePath;
  }

  private getVehicleImageSource(data: any): any[] {
    const vehicleImageArray = this.coerceImageCollection(data?.vehicleImage);
    const mobileImageArray = this.coerceImageCollection(data?.mobileImageArray);
    const modelImageArray = this.coerceImageCollection(data?.modelImageArray);
    const genericImageArray = this.coerceImageCollection(data?.images);

    const vehicleMobileOnly = vehicleImageArray.filter((image: any) => {
      const imageForValue = Number(image?.image_for ?? image?.imageFor ?? image?.imageForEnumId);
      return imageForValue === 79;
    });

    const mergedSource = [
      ...mobileImageArray,
      ...vehicleMobileOnly,
      ...vehicleImageArray,
      ...modelImageArray,
      ...genericImageArray
    ];

    if (mergedSource.length === 0) {
      return [];
    }

    return mergedSource.filter((image: any, index: number, array: any[]) => {
      const imageKey = this.getImageIdentityKey(image, index);
      return index === array.findIndex((item: any, itemIndex: number) => this.getImageIdentityKey(item, itemIndex) === imageKey);
    });
  }

  private coerceImageCollection(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }

    const textValue = this.getValidImageValue(value);
    if (!textValue) {
      return [];
    }

    return textValue
      .split(/\r?\n|,/)
      .map((entry: string) => this.getValidImageValue(entry))
      .filter((entry: string | null) => !!entry);
  }

  private getImageIdentityKey(image: any, fallbackIndex: number): string {
    if (typeof image === 'string') {
      return this.getValidImageValue(image) || `string-${fallbackIndex}`;
    }

    if (!image || typeof image !== 'object') {
      return `unknown-${fallbackIndex}`;
    }

    return (
      this.getValidImageValue(
        image.image_unique_name ||
        image.imageUniqueName ||
        image.image_name ||
        image.imageName ||
        image.fileName ||
        image.filename ||
        image.image_unique_signed_url ||
        image.imageSignedUrl
      ) || `object-${fallbackIndex}`
    );
  }

  private normalizeVehicleImageSource(sourceImages: any[]): any[] {
    return sourceImages
      .map((image: any, index: number) => {
        if (typeof image === 'string') {
          const normalizedFileName = this.getValidImageValue(image);
          if (!normalizedFileName) {
            return null;
          }

          return {
            image_unique_name: normalizedFileName,
            image_name: normalizedFileName,
            imageSerialNumber: index + 1
          };
        }

        if (!image || typeof image !== 'object') {
          return null;
        }

        const normalizedUniqueName = this.getValidImageValue(
          image.image_unique_name || image.imageUniqueName || image.fileName || image.filename
        );
        const normalizedImageName = this.getValidImageValue(
          image.image_name || image.imageName || image.file_name || image.name || normalizedUniqueName
        );

        return {
          ...image,
          image_unique_name: normalizedUniqueName,
          image_name: normalizedImageName,
          image_unique_signed_url: this.getValidImageValue(image.image_unique_signed_url || image.imageSignedUrl),
          imageSerialNumber: Number(image.imageSerialNumber || image.image_serial_number || index + 1)
        };
      })
      .filter((image: any) => !!image);
  }

  private resolveVehicleImageUrl(image: any): string | null {
    const uploadPathUrl = this.buildUploadImageUrl(image?.image_unique_name || image?.image_name);
    if (uploadPathUrl) {
      return uploadPathUrl;
    }

    const signedUrl = this.getValidImageValue(image?.image_unique_signed_url);
    if (signedUrl) {
      return signedUrl;
    }

    const rawUrl = this.getValidImageValue(image?.image_url || image?.imageUrl || image?.url);
    if (rawUrl) {
      return rawUrl;
    }

    return this.buildUploadImageUrl(image?.image_unique_name || image?.image_name);
  }

  private buildUploadImageUrl(fileName: any): string | null {
    const candidates = this.buildUploadImageCandidates(fileName);
    return candidates.length > 0 ? candidates[0] : null;
  }

  private buildUploadImageCandidates(fileName: any): string[] {
    const normalizedFileName = this.getValidImageValue(fileName);
    if (!normalizedFileName) {
      return [];
    }

    if (/^https?:\/\//i.test(normalizedFileName)) {
      return [normalizedFileName];
    }

    const normalizedServerUrl = (this.vehicleModelService.serverUrl || '')
      .trim()
      .replace(/\/+$/, '');

    if (!normalizedServerUrl) {
      return [];
    }

    const serverRootUrl = normalizedServerUrl.replace(/\/api$/i, '');

    const encodedFilePath = normalizedFileName
      .replace(/^\/+/, '')
      .replace(/^api\/upload\//i, '')
      .replace(/^upload\//i, '')
      .split('/')
      .map((segment: string) => encodeURIComponent(segment))
      .join('/');

    return [
      `${normalizedServerUrl}/upload/${encodedFilePath}`,
      `${serverRootUrl}/upload/${encodedFilePath}`
    ];
  }

  private getValidImageValue(value: any): string | null {
    if (value == null) {
      return null;
    }

    const valueText = String(value)
      .trim()
      .replace(/^['"]+|['"]+$/g, '')
      .trim();
    if (!valueText || valueText.toLowerCase() === 'null' || valueText.toLowerCase() === 'undefined') {
      return null;
    }

    return valueText;
  }

  startTimer() {
    if (this.beforeRideTimerInterval) clearInterval(this.beforeRideTimerInterval);

    this.beforeRideTimerInterval = setInterval(() => {
      this.timeSpentBeforeBookingRide--;

      if (this.timeSpentBeforeBookingRide <= 0) {
        clearInterval(this.beforeRideTimerInterval);
        this.showAlert(messageConstants.defaultAvailabilityTimeBetweenScanQRandStartRideExpired);
        this.router.navigate(['home']);
        return;
      }

      const minutes = Math.floor(this.timeSpentBeforeBookingRide / 60);
      const seconds = this.timeSpentBeforeBookingRide % 60;
      this.timeSpentBeforeBookingRideValue = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  startRide() {
    const walletBalance = Number(this.walletBalance);
    const minimumWalletAmount = Number(this.vehicleDetails?.min_wallet_amount);
    const minWalletRequired = Number.isFinite(minimumWalletAmount) && minimumWalletAmount > 0 ? minimumWalletAmount : 0;

    // Never allow ride booking with zero/negative/invalid wallet.
    if (!Number.isFinite(walletBalance) || walletBalance <= 0) {
      const topUpAmount = minWalletRequired > 0 ? minWalletRequired : 1;
      this.showAlert(`Wallet balance is insufficient. Please add at least ₹${topUpAmount} to start this ride.`);
      this.router.navigate(['home/Wallet'], { queryParams: { amount: topUpAmount } });
      return;
    }

    if (walletBalance < minWalletRequired) {
      const needed = +(minWalletRequired - walletBalance).toFixed(2);
      this.showAlert(`Please add ₹${needed} to your wallet to start this ride.`);
      this.router.navigate(['home/Wallet'], { queryParams: { amount: needed } });
      return;
    }

    clearInterval(this.beforeRideTimerInterval);
    const deviceId = this.vehicleDetails.lockDetails[0].lockNumber;

    this.subs.add(
      this.vehicleModelService.unLockVehicle(deviceId, instructionCodeConstant.deviceUnlock, this.userDetails.userId, this.userDetails.userTypeEnumId).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.router.navigate(['home/rideDetails'], { queryParams: { minHireTime: this.minHireTime } });
          } else {
            this.showAlert(res.message);
          }
        }
      })
    );
  }

  get vehicleIdentifier(): string {
    return (
      this.vehicleDetails?.lockDetails?.[0]?.lockNumber ||
      this.vehicleDetails?.lockDetails?.[0]?.iotId ||
      this.vehicleQRDetails?.lockNumber ||
      this.vehicleQRDetails?.lockId ||
      this.vehicleQRDetails?.uId ||
      this.vehicleDetails?.lockDetails?.[0]?.uId ||
      'ID Pending'
    );
  }

  openImageZoom(imageUrl: string) {
    this.zoomedImageUrl = imageUrl;
  }

  closeImageZoom() {
    this.zoomedImageUrl = null;
  }

  handleBackNavigation() {
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Evegah Alert',
      message: message,
      cssClass: 'wallet-info-alert',
      buttons: ['OK'],
    });
    await alert.present();
  }

  ngOnDestroy(): void {
    if (this.beforeRideTimerInterval) clearInterval(this.beforeRideTimerInterval);
    this.subs.unsubscribe();
  }
}