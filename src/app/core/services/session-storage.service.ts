import { Injectable } from '@angular/core';

import { decryptCipherValueIntoPlainValue, encryptValueIntoCipherValue } from '../helper/common-helper';

@Injectable({
  providedIn: 'root',
})

export class SessionStorageService {

  constructor() { }

  setItem(key: string, value: any) {

    const dataString = JSON.stringify(value);
    const encryptedData = encryptValueIntoCipherValue(dataString);

    sessionStorage.setItem(key, encryptedData);

  }

  getItem(key: string) {

    const data = sessionStorage.getItem(key);

    if (!data) {
      return null;
    }

    const decryptedData = decryptCipherValueIntoPlainValue(data);
    return decryptedData;

  }

  removeItem(key: string) {
    sessionStorage.removeItem(key);
  }

  clearStorage() {
    sessionStorage.clear();
  }

}