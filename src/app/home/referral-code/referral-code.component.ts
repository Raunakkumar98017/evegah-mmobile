import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';

import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { EnumService } from 'src/app/core/services/enum.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { SpinnerService } from 'src/app/core/services/spinner.services';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-referral-code',
  templateUrl: './referral-code.component.html',
  styleUrls: ['./referral-code.component.scss'],
})
export class ReferralCodeComponent implements OnInit {
  pageTitle = 'Referral Code';
  referralCode = '';
  subscription: Subscription[] = [];
  userDetails: any;

  constructor(
    public toasterService: ToasterService,
    public spinnerService: SpinnerService,
    private enumService: EnumService,
    public router: Router,
    private authService: AuthService,
    private localStorageService: LocalStorageService
  ) { }

  ngOnInit() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
    this.userDetail();
  }

  userDetail() {

    this.spinnerService.presentLoading();

    this.subscription.push(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe((res) => {
        if (res.statusCode === 200) {

          const data = res.data[0];

          if (data.registrationStatus === false) {
            this.router.navigate(['session/basic-info']);
          } else {
            this.referralCode = data.autoGenUserReferralCode;
          }

          this.spinnerService.dismissLoading();

        } else if (res.statusCode === 401) {
          this.authService.logout();
          this.spinnerService.dismissLoading();
        } else {
          this.toasterService.presentToast(
            res.message,
            TOASTER_CONSTANTS.WARNING
          );
          this.spinnerService.dismissLoading();
        }
      })
    );
  }

  async copyToClipboard() {

    await Clipboard.write({
      string: this.referralCode
    });

    this.toasterService.presentToast(
      "Referral Code Copied !",
      TOASTER_CONSTANTS.SUCCESS
    );

  }

  async shareReferralCode() {

    const message = `Just a quick reminder, you can use my referral code ${this.referralCode} on Evegah for exclusive benefits. Don't miss out! 🚀`;

    await Share.share({
      text: message
    });
  }

}
