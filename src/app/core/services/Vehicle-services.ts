

/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs';
//import { IMobileNumber } from '../interfaces/session/mobileNumber';
import { IVehicleModelDetails } from '../interfaces/vehicle/vehicleDetail';
import { environment } from 'src/environments/environment';
import { IVehicleList } from '../interfaces/vehicle/vehicle-list';
import { LocalStorageService } from './local-storage.service';
import storageKeyNameConstants from '../constants/storage-keyname-constants';

@Injectable({
  providedIn: 'root',
})
export class VehicleModelService {
  access_token: any
  serverUrl: string = '';

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
  }

  private getUserDetails() {
    return this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true) || {};
  }

  private getAccessToken() {
    const userDetails = this.getUserDetails();
    return userDetails.access_token || userDetails.accessToken || userDetails.token || '';
  }

  private getUserId() {
    const userDetails = this.getUserDetails();
    return String(userDetails.userId || userDetails.id || '').trim();
  }

  VehicleModelDetails(VehicleModelDetails: IVehicleModelDetails): Observable<any> {
    this.access_token = this.getAccessToken();

    const url = this.serverUrl + 'addUpdateVehicleModelDetails?' + 'access_token=' + this.access_token;;
    return this.http.post<IVehicleModelDetails>(url, VehicleModelDetails);
  }

  VehicleList(): Observable<any> {
    this.access_token = this.getAccessToken();

    const url = this.serverUrl + 'v1/getVehicleModel?VehicleId=0&statusEnumId=1' + '&access_token=' + this.access_token;;
    return this.http.get<IVehicleList>(url);
  }

  getVehicleDetailServices(data: any): Observable<any> {
    this.access_token = this.getAccessToken();
    const url = this.serverUrl + `v1/getVehicleModel?VehicleId=${data}&statusEnumId=1` + '&access_token=' + this.access_token;;
    return this.http.get<IVehicleList>(url);
  }

  unLockVehicle(deviceId: any, instructionId: any, userId: any, userTypeEnumId: any): Observable<any> {
    this.access_token = this.getAccessToken();

    const url = this.serverUrl + `setInstructionToLockUnlockDevice?deviceId=${deviceId}&instructionId=${instructionId}&userId=${userId}&userTypeEnumId=${userTypeEnumId}` + '&access_token=' + this.access_token;
    return this.http.get<IVehicleModelDetails>(url);
  }

  getBikeProduceDetails(): Observable<any> {
    this.access_token = this.getAccessToken();

    const url = this.serverUrl + 'v1/getBikeProduceDetails?bikeProduceId=' + 0 + '&statusEnumId=' + 0 + '&access_token=' + this.access_token;;
    return this.http.get<IVehicleModelDetails>(url);
  }

  userRideDetails(): Observable<any> {
    this.access_token = this.getAccessToken();
    const userId = this.getUserId();

    if (!this.access_token || !userId) {
      return of({
        statusCode: 401,
        message: 'Session expired. Please login again.',
        data: []
      });
    }

    const url = this.serverUrl + `v1/getLastRideBookingDetails?rideBookingId=0&statusEnumId=1` + '&id=' + userId + '&access_token=' + this.access_token;
    return this.http.get<IVehicleModelDetails>(url);
  }

  scanQr(scanQRstring: any, enteredLockNumber: string): Observable<any> {
    this.access_token = this.getAccessToken();

    const params = {
      qrString: scanQRstring ? scanQRstring : null, // if qr string is not available, pass null in qrString
      userId: this.localStorageService.getItem(storageKeyNameConstants.USER_ID),
      lockNumber: scanQRstring ? null : enteredLockNumber // if qr string is available, pass null in lockNumber
    };

    const url = this.serverUrl + 'qrDecrypted?' + 'access_token=' + this.access_token;
    return this.http.post<any>(url, params);
  }

  turnOnDeviceLight(deviceId: string, userId: string): Observable<any> {
    this.access_token = this.getAccessToken();

    const params = {
      userId,
      deviceId
    };

    const url = `${this.serverUrl}setDeviceLightOnInstruction?deviceId=${deviceId}&access_token=${this.access_token}`;
    return this.http.post<any>(url, params);
  }

  turnOffDeviceLight(deviceId: string, userId: string): Observable<any> {
    this.access_token = this.getAccessToken();

    const params = {
      userId,
      deviceId
    };

    const url = `${this.serverUrl}setDeviceLightOffInstruction?deviceId=${deviceId}&access_token=${this.access_token}`;
    return this.http.post<any>(url, params);
  }
}
