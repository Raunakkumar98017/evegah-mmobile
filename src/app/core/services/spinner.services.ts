//===============================================================================
// © 2021 .Kritin Digital solutions  All rights reserved.
// Original Author: Aman Mishra
// Original Date: 7 June 2021
// @desc : spinner operator
//==============================================================================
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  loading: any;
  private visible$ = new BehaviorSubject<boolean>(false);

  constructor(
    public loadingController: LoadingController,
  ) { }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Please wait...',
      spinner: 'crescent',
      cssClass: 'loader-css-class',
    });
    (await this.loading).present();
  }

  async dismissLoading() {
    try {
      if (this.loading) {
        (await this.loading).dismiss();
      }
    } catch (error) {
      // ignore: loader may already be dismissed
    } finally {
      this.loading = null;
    }
  }

  show() {
    this.visible$.next(true);
  }

  hide() {
    this.visible$.next(false);
  }

  isVisible(): Observable<boolean> {
    return this.visible$.asObservable().pipe(share());
  }
}
