import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from './local-storage.service';
import storageKeyNameConstants from '../constants/storage-keyname-constants';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  serverUrl = '';

  userDetails: any;
  access_token: string;


  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS, true);
    this.access_token = this.userDetails?.access_token;
  }

  orderDataService(price: any, minrate: any): Observable<any> {
    const amount = { amount: (price * minrate) * 100 };
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/order?` + 'access_token=' + this.access_token;;
    return this.http.post<any>(url, amount);
  }

  verifyorderService(verifyParameter: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/verifyPayment?` + 'access_token=' + this.access_token;
    return this.http.post<any>(url, verifyParameter);
  }

  payout(payoutDetails: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/payout?` + 'access_token=' + this.access_token;
    return this.http.post<any>(url, payoutDetails);
  }

  rideBooking(rideBookingDetails: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/rideBooking?` + 'access_token=' + this.access_token;
    return this.http.post<any>(url, rideBookingDetails);
  }

  updateDetailsRideEnds(RideEndDetails: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/updateDetailsRideEnds?` + 'access_token=' + this.access_token;;
    return this.http.post<any>(url, RideEndDetails);
  }

  updateDetailsRideEndsForSummary(RideEndDetails: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/updateDetailsRideEnds?type=summaryCharges&access_token=` + this.access_token;;
    return this.http.post<any>(url, RideEndDetails);
  }
  getAllPayments(fromDate: number, toDate: number): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/getAllPayments?fromDate=${fromDate}&toDate=${toDate}` + '&access_token=' + this.access_token;
    return this.http.get<any>(url);
  }

  getRideBookingDetails(rideBookingId: number, statusEnumId: number, user_id: number): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/getRideBookingDetails?rideBookingId=${rideBookingId}&statusEnumId=${statusEnumId}&id=${user_id}` + '&access_token=' + this.access_token;
    return this.http.get<any>(url);
  }

  addWithdrawRequestFromUser(widrawal: any): Observable<any> {
    const widrawalData = {
      "id": this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).userId,
      "amount": widrawal
    }
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `getWithdrawRequestFromUser?` + 'access_token=' + this.access_token;;
    return this.http.post<any>(url, widrawalData);
  }

  getWithdrawnuserlist(requestId: any, id: any, withdrawRequestStatusEnumId: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + 'getWithdrawnList?requestId=' + requestId + '&id=' + id + '&withdrawRequestStatusEnumId=' + withdrawRequestStatusEnumId + '&access_token=' + this.access_token;
    return this.http.get(url);
  }

  insertUserTransaction(widrawal: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `insertUserTransaction?` + 'access_token=' + this.access_token;;
    return this.http.post<any>(url, widrawal);
  }

  addAmountToUserWallet(widrawal: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/addAmountToUserWallet?` + 'access_token=' + this.access_token;;
    return this.http.post<any>(url, widrawal);
  }

  payExtraChargesAmount(ExtraChargesAmount: any) {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + `v1/payExtraCharges?` + 'access_token=' + this.access_token;;
    return this.http.post<any>(url, ExtraChargesAmount);

  }

  getLatestTransactionList(id: any): Observable<any> {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + 'getLatestTransactionList?id=' + id + '&access_token=' + this.access_token;
    return this.http.get(url);
  }

  rideHistory(): Observable<any> {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = this.serverUrl + 'v1/getRideHistory?id=' + this.userDetails.userId + '&access_token=' + this.access_token;
    return this.http.get(url);
  }

  getRideHistory(rideBookingId?: number) {

    const _rideBookingId = rideBookingId ? rideBookingId : 0;

    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;

    const url = this.serverUrl + 'v1/getReportBike?userId=' + this.userDetails.userId + '&rideBookingId=' + _rideBookingId + '&access_token=' + this.access_token;
    return this.http.get(url);

  }
}
