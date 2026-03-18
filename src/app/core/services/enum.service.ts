/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { IGetState } from '../interfaces/master/state/state';
import { IGetCity } from '../interfaces/master/city/city';
import { IGetEnum } from '../interfaces/master/enum/enum';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';
import storageKeyNameConstants from '../constants/storage-keyname-constants';

@Injectable({
  providedIn: 'root',
})
export class EnumService {
  serverUrl: string = '';

  access_token: string;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
  }

  getState(id: number): Observable<IGetState> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `getStates?country_id=${id}` + '&access_token=' + this.access_token;
    return this.http.get<IGetState>(url);
  }

  getCity(stateId: number): Observable<IGetCity> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `getCities?state_id=${stateId}` + '&access_token=' + this.access_token;
    return this.http.get<IGetCity>(url);
  }

  getEnum(Enum_type: string): Observable<IGetEnum> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `GetEnumDetail?Enum_type=${Enum_type}` + '&access_token=' + this.access_token;
    return this.http.get<IGetEnum>(url);
  }

  getUserList(userId: number, statusEnumId: number): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + 'getUser?id=' + userId + '&statusEnumId=' + statusEnumId + '&access_token=' + this.access_token;
    return this.http.get<any>(url);
  }

  updateLanguageService(lang: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `/updateUserLanguage?` + 'access_token=' + this.access_token;
    return this.http.post<any>(url, lang);
  }
}
