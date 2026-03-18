/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';
import storageKeyNameConstants from '../constants/storage-keyname-constants';

@Injectable({
  providedIn: 'root',
})
export class getEnumWallBallanceService {
  serverUrl: string = '';

  access_token: string;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
  }

  GetEnumDetails(): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + 'GetEnumDetail?Enum_type=' + 'user permission' + '&access_token=' + this.access_token;
    return this.http.get<any>(url);
  }


}