
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';
import storageKeyNameConstants from '../constants/storage-keyname-constants';

@Injectable({
  providedIn: 'root',
})
export class zoneService {

  access_token: string;

  serverUrl: string = '';

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
  }

  getNearbyZones(country: string, state: string, city: string) {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = `${this.serverUrl}v1/getzoneDetailWithBikeCountList?zoneId=0&mapCityId=0&mapCountryName=${country}&mapStateName=${state}&mapCityName=${city}&dataFor=ForMapSearch&access_token=${this.access_token}`
    return this.http.get<any>(url);
  }

}