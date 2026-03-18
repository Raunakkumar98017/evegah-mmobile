import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from 'src/app/core/services/session.service';

import { Storage } from '@ionic/storage';
import { ToastController, Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { LocalStorageService } from '../core/services/local-storage.service';
import storageKeyNameConstants from '../core/constants/storage-keyname-constants';
import { SessionStorageService } from '../core/services/session-storage.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  authState = new BehaviorSubject(false);
  private logoutInProgress = false;

  constructor(
    private sessionService: SessionService,
    private router: Router,
    private storage: Storage,
    private platform: Platform,
    public toastController: ToastController,
    private localStorageService: LocalStorageService,
    private sessionStorageService: SessionStorageService,
  ) {

    this.platform.ready().then(() => {
      document.addEventListener("backbutton", () => {
        // code that is executed when the user pressed the back button
        this.ifLoggedIn();
      });
    });

  }

  ifLoggedIn() {
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    if (userDetails) {
      this.router.navigate(['/home'])
      this.login()
      return false
    } else {
      return true
    }
  }

  login() {
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    if (userDetails) {
      this.router.navigate([`home`], { state: { reload: true } }).then();
      this.authState.next(true);
    } else {
      this.router.navigate(['session']);
      this.authState.next(false);

    }
  }

  logout() {
    if (this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;
    this.localStorageService.clearStorage();
    this.sessionStorageService.clearStorage();
    this.authState.next(false);
    this.router.navigate(['session']);
    setTimeout(() => {
      this.logoutInProgress = false;
    }, 1500);
    // navigator['app'].exitApp();
  }

  isAuthenticated() {
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    const registrationStatus = this.localStorageService.getItem(storageKeyNameConstants.REGISTRATION_STATUS);
    const isRegistered = registrationStatus === true || userDetails?.registrationStatus === true || registrationStatus === null;

    if (userDetails && isRegistered) {
      return true;
    } else {
      return false;
    }
  }

}
