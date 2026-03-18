/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs/internal/Observable";
import { IMobileNumber } from "../interfaces/session/mobileNumber";
import { IBasicInfo } from "../interfaces/session/basicInfo";
import { environment } from "src/environments/environment";
import { LocalStorageService } from "./local-storage.service";
import storageKeyNameConstants from "../constants/storage-keyname-constants";

@Injectable({
  providedIn: "root",
})
export class SessionService {
  serverUrl: string = "";

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
  }

  checkMobileNumber(mobileNumber: IMobileNumber): Observable<any> {
    const url = this.serverUrl + "CheckCustomerMobileNumber";
    return this.http.post<IMobileNumber>(url, mobileNumber);
  }

  sendOtp(mobileNumber: number, otp: number): Observable<any> {
    // const url = `https://2factor.in/API/V1/c24ade83-48a0-11e8-a895-0200cd936042/SMS/${mobileNumber}/${otp}/evegahOTP`;
    // const url = `https://2factor.in/API/V1/7d84d134-26fe-11ed-9c12-0200cd936042/SMS/${mobileNumber}/${otp}/EVEGAHOTP`;

    const url = ` https://2factor.in/API/V1/7d84d134-26fe-11ed-9c12-0200cd936042/SMS/${mobileNumber}/${otp}/eVegah+SMS`;
    return this.http.get<any>(url);
  }

  userRegistration(basicInfo: IBasicInfo): Observable<any> {
    let access_token = this.localStorageService.getItem(
      storageKeyNameConstants.USER_DETAILS
    ).access_token;
    const url = this.serverUrl + "AddUser?" + "access_token=" + access_token;
    return this.http.post<IBasicInfo>(url, basicInfo);
  }

  logOutToken() {
    let access_token = this.localStorageService.getItem(
      storageKeyNameConstants.USER_DETAILS
    ).access_token;
    const url = this.serverUrl + "logOutUser?" + "access_token=" + access_token;
    return this.http.post<any>(url, {
      id: this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS)
        .userId,
    });
  }
}
