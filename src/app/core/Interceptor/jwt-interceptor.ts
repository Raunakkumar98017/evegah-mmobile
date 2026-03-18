//===============================================================================
// © 2021 .Kritin Digital solutions  All rights reserved.
// Original Author: Aman Mishra
// Original Date: 7 June 2021
//==============================================================================
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';
import storageKeyNameConstants from '../constants/storage-keyname-constants';
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private localStorageService: LocalStorageService) { }
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    const token = userDetails?.access_token || userDetails?.accessToken || userDetails?.token;

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(request);
  }
}
