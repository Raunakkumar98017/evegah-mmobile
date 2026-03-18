//===============================================================================
// © 2021 .Kritin Digital solutions  All rights reserved.
// Original Author: Aman Mishra
// Original Date: 3 June 2021
//==============================================================================

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataShareService {
  sidebar = new BehaviorSubject(true);
  sidebarObservable = this.sidebar.asObservable();

  constructor() { }
  sidebarCollapsed(flag: any) {
    this.sidebar.next(flag);
  }
}
