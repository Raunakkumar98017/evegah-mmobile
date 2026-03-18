import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import storageKeyNameConstants from '../constants/storage-keyname-constants';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class FaqService {

  access_token: string = '';
  serverUrl: string = '';

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {
    this.serverUrl = environment.serverUrl;
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
  }

  getAllFAQs() {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = `${this.serverUrl}getSectionFAQDetail?sectionId=0&questionId=0&faqPublishStatusEnumId=87&access_token=${this.access_token}`;
    return this.http.get<any>(url);
  }

  getFAQsBySectionId(sectionId: number) {
    this.access_token = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).access_token;
    const url = `${this.serverUrl}getSectionFAQDetail?sectionId=${sectionId}&questionId=0&faqPublishStatusEnumId=87&access_token=${this.access_token}`;
    return this.http.get<any>(url);
  }
}
