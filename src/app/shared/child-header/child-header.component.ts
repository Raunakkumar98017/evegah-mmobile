import { Location } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

import { ToasterService } from 'src/app/core/services/toaster.service';

@Component({
  selector: 'app-child-header',
  templateUrl: './child-header.component.html',
  styleUrls: ['./child-header.component.scss'],
})
export class ChildHeaderComponent implements OnInit {
  @Input() title!: string;
  @Input() onBack!: () => void;

  subscription: Subscription[] = [];
  userDetails: any;
  cartItemsCount!: number;
  constructor(
    public router: Router,
    public toasterService: ToasterService,
    private location: Location,
    private localStorageService: LocalStorageService
  ) {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
  }

  ngOnInit() { }

  backNavigation() {

    if (typeof this.onBack !== 'undefined') {
      return this.onBack();
    }

    this.location.back();
  }

  navigate(path: string) {
    this.router.navigate([`home/${path}`]);
  }

}
