import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import enumCodeConstants from '../constants/enum-code-constants';

@Injectable({
  providedIn: 'root',
})
export class DeviceServices {

  serverUrl = '';

  constructor(
    private http: HttpClient,
  ) {
    this.serverUrl = environment.serverUrl;
  }

  lockVehicle(dId: string): Observable<any> {
    const url = `${this.serverUrl}lockDevice?dId=${dId}&lockStatus=${enumCodeConstants.lock}`;
    return this.http.get<any>(url);
  }

  unlockVehicle(dId: string): Observable<any> {
    const url = `${this.serverUrl}unlockDevice?dId=${dId}&lockStatus=${enumCodeConstants.unlock}`;
    return this.http.get<any>(url);
  }

  deviceLightOn(deviceId: string): Observable<any> {
    const url = `${this.serverUrl}DeviceLightOn?dId=${deviceId}`;
    return this.http.get<any>(url);
  }

  deviceLightOff(deviceId: string): Observable<any> {
    const url = `${this.serverUrl}DeviceLightOff?dId=${deviceId}`;
    return this.http.get<any>(url);
  }

}