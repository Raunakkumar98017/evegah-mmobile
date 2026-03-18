import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PUBLISHED_PRODUCTS_ID } from '../constants/common-constant';
// import { ServerUrl } from '../helper/config-file-accessor';
import { ICommonResponse } from '../interfaces/common/common-response';
//import { IHistoryData } from '../interfaces/common/history-response';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(private http: HttpClient) { }
  serverEndPoint = environment.serverUrl;

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const url = this.serverEndPoint + 'fileUpload';
    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true,
      responseType: 'json',
    });
    return this.http.request(req);
  }

  deleteImage(fileName: any): Observable<ICommonResponse> {
    const url = this.serverEndPoint + 'fileDelete';
    return this.http.post<ICommonResponse>(url, fileName);
  }

  getHistoryDetail(masterName: string, masterId: Number): Observable<any> {
    const url =
      this.serverEndPoint +
      'getMasterRemarkByMasterNameAndMasterId?masterName=' +
      masterName +
      '&mastersId=' +
      masterId;
    return this.http.get<any>(url);
  }

  convertDate(date: Date) {

    if (date !== null && date !== undefined) {
      const formattedDate = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();
      return formattedDate
    } else {
      return null;
    }

  }
}
