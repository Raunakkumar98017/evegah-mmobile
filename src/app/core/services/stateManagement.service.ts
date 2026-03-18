import { Injectable } from '@angular/core';

// Required to look for more proper way for handling state management and state subscription
@Injectable({
  providedIn: 'root'
})
export class StateManagementService {

  showSearchboxOnMap: boolean = false;

  constructor() { }

  updateSearchboxStatus(value: boolean) {
    this.showSearchboxOnMap = value;
    // console.log(this.showSearchboxOnMap, 'after change');
  }
}
