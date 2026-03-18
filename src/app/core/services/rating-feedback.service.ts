import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import storageKeyNameConstants from '../constants/storage-keyname-constants';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class RatingFeedbackService {

  access_token: string = '';
  serverUrl: string = '';

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
  }

  addRatingFeedback(params: any) {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = `${this.serverUrl}addRideBookingRating?access_token=${this.access_token}`;
    return this.http.post<any>(url, params);
  }
}
