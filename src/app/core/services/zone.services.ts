
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
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    this.access_token = userDetails?.access_token || userDetails?.accessToken || '';
  }

  getNearbyZones(country: string, state: string, city: string) {
    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    this.access_token = userDetails?.access_token || userDetails?.accessToken || this.access_token || '';
    const enc = (s: string) => encodeURIComponent(s || '');
    const url = `${this.serverUrl}v1/getzoneDetailWithBikeCountList?zoneId=0&mapCityId=0&mapCountryName=${enc(country)}&mapStateName=${enc(state)}&mapCityName=${enc(city)}&dataFor=ForMapSearch&access_token=${enc(this.access_token)}`;
    return this.http.get<any>(url);
  }

}