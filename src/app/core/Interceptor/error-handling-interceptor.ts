//===============================================================================
// © 2021 .Kritin Digital solutions  All rights reserved.
// Original Author: Aman Mishra
// Original Date: 7 June 2021
//@Desc: Http error handling intercept
//==============================================================================

import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';
import { SpinnerService } from '../services/spinner.services';
import messageConstants from '../constants/message-constants';
import { Router } from '@angular/router';

@Injectable()

export class HttpErrorInterceptor implements HttpInterceptor {

  displayAlert: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public loadingController: LoadingController,
    public spinnerService: SpinnerService,
    public alertController: AlertController,
  ) { }

  private async safeDismissLoading() {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
      // ignore: overlay may not exist
    }
  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: [{
        text: 'Ok',
        role: 'cancel',
        handler: () => {
          this.displayAlert = false;
        }
      }],
    });

    if (this.displayAlert === false) {
      this.displayAlert = true;
      await alert.present();
    }

  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((error: HttpErrorResponse) => {

      let errorMessage = '';
      if (error.error instanceof ErrorEvent) {
        // client-side error
        errorMessage = `Error: ${error.error.error.MessageList}`;
      } else {

        const _error = error.error;
        const statusCode = _error?.statusCode || error.status;
        const statusMessage = _error?.message || error.message;
        const isSessionRoute = this.router.url?.startsWith('/session');

        // server-side error
        if (statusCode === 401 && statusMessage === 'token is not valid' && !isSessionRoute) {
          this.safeDismissLoading();
          this.spinnerService.dismissLoading();
          this.showAlert(messageConstants.youHaveBeenLoggedOut);
          this.authService.logout();
        }

        errorMessage = `We Are Unable To Process Your Request Please Try Again Later \nView Error Details Below: \nError Code: ${statusCode} \nMessage: ${statusMessage}`;
      }
      // window.alert(errorMessage);
      // this.toastr.error(errorMessage)
      return throwError(() => error);
    }))
  }
}
