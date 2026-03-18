import { Injectable } from '@angular/core';

import { decryptCipherValueIntoPlainValue, encryptValueIntoCipherValue } from '../helper/common-helper';
import storageKeyNameConstants from '../constants/storage-keyname-constants';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import messageConstants from '../constants/message-constants';
import { SpinnerService } from './spinner.services';

@Injectable({
  providedIn: 'root',
})

export class LocalStorageService {

  constructor(
    public router: Router,
    public alertController: AlertController,
    public modalController: ModalController,
    public loadingController: LoadingController,
    public spinnerService: SpinnerService
  ) { }

  setItem(key: string, value: any) {

    const dataString = JSON.stringify(value);
    const encryptedData = encryptValueIntoCipherValue(dataString);

    localStorage.setItem(key, encryptedData);

  }

  getItem(key: string, skipCheck?: boolean) {

    const data = localStorage.getItem(key);

    if (!data) {
      return this.handleDataUnavailability(key, skipCheck);
    }

    try {
      const decryptedData = decryptCipherValueIntoPlainValue(data);

      if (key === storageKeyNameConstants.USER_DETAILS && decryptedData && typeof decryptedData === 'object') {
        const token = decryptedData.access_token || decryptedData.accessToken || decryptedData.token;

        if (token && !decryptedData.access_token) {
          decryptedData.access_token = token;
        }
      }

      return decryptedData;
    } catch (error) {
      localStorage.removeItem(key);
      return this.handleDataUnavailability(key, skipCheck);
    }

  }

  removeItem(key: string) {
    localStorage.removeItem(key);
  }

  clearStorage() {
    const lastMapState = localStorage.getItem(storageKeyNameConstants.LAST_MAP_STATE);
    const encryptedAvatar = localStorage.getItem(storageKeyNameConstants.USER_AVATAR);
    const legacyAvatar = localStorage.getItem('mobile_profile_avatar_base64');

    localStorage.clear();

    if (encryptedAvatar) {
      localStorage.setItem(storageKeyNameConstants.USER_AVATAR, encryptedAvatar);
    }

    if (legacyAvatar) {
      localStorage.setItem('mobile_profile_avatar_base64', legacyAvatar);
    }

    if (lastMapState) {
      localStorage.setItem(storageKeyNameConstants.LAST_MAP_STATE, lastMapState);
    }
  }

  private async safeDismissModal() {
    try {
      await this.modalController.dismiss();
    } catch (error) {
      // ignore: overlay may not exist
    }
  }

  private async safeDismissLoading() {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
      // ignore: overlay may not exist
    }
  }

  handleDataUnavailability(key: string, skipCheck?: boolean) {

    if (skipCheck === true) {
      return null;
    }

    if (key === storageKeyNameConstants.USER_DETAILS || key === storageKeyNameConstants.USER_ID) {

      const isSessionRoute = this.router.url?.startsWith('/session');

      if (isSessionRoute) {
        return null;
      }

      this.router.url !== '/session' && this.showAlert(messageConstants.yourAccountHasBeenLoggedOut);

      this.safeDismissModal();
      this.safeDismissLoading();
      this.spinnerService.hide();

      this.router.navigate(['/session']);
      return this.clearStorage();

    }

    return null;

  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

}