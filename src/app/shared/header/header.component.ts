/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { APPLICATION_VERSION, TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';
import { greetHandler } from 'src/app/core/helper/common-helper';
import { ITabRoutes } from 'src/app/core/interfaces/common/tabRoutes';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { EnumService } from 'src/app/core/services/enum.service';
import { AuthService } from 'src/app/service/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { StateManagementService } from 'src/app/core/services/stateManagement.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(-90deg)' })),
      state('expanded', style({ transform: 'rotate(0deg)' })),
      transition('expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ])
  ]
})

export class HeaderComponent implements OnChanges, OnDestroy {

  @Output() onSearchControlClick = new EventEmitter();

  policyExpanded: boolean = false;
  greetMessage: string = '';
  subscription: Subscription[] = [];
  userDetails: any;
  cartItemsCount!: number;
  showSubmenu: boolean = false;
  expanded!: boolean;
  isExpanded!: boolean;
  isShowing: boolean = false;
  routePath: string = '';
  version;
  _userDetails: any;
  isUserDetailLoading: boolean = false;
  hasHandledUnauthorized: boolean = false;
  profileAvatarUrl: string = '';
  private readonly profileImageStorageKey = 'mobile_profile_avatar_base64';
  notificationItems = [
    {
      title: 'Ride Reminder',
      message: 'Complete pre-ride checks before starting your ride.',
      time: 'Just now'
    },
    {
      title: 'Wallet Update',
      message: 'Add balance to avoid interruption during long trips.',
      time: 'Today'
    },
    {
      title: 'Safety Alert',
      message: 'Always wear a helmet and follow local traffic rules.',
      time: 'This week'
    }
  ];
  showNotificationsPanel = false;

  tabRoutesArray: Array<ITabRoutes> = [
    {
      tab: 'Wallet',
      route: '../home/Wallet',
      props: '/home/Wallet',
      label: 'Add Wallet Balance',
      icon: 'cash-outline',
      isSelected: true,
    },
    {
      tab: 'Ride History',
      route: '/home/rideHistory',
      props: '/home/rideHistory',
      label: 'Ride History',
      icon: 'bicycle-outline',
      isSelected: false,
    },
    {
      tab: 'Payment History',
      route: '/home/paymentHistory',
      props: '/home/paymentHistory',
      label: 'Payment History',
      icon: 'card-outline',
      isSelected: false,
    },
    {
      tab: 'Referral Code',
      route: '/home/referralCode',
      props: '/home/referralCode',
      label: 'Referral Code',
      icon: 'git-network-outline',
      isSelected: false,
    },
    {
      tab: 'FAQs',
      route: '/home/faqs',
      props: '/home/faqs',
      label: 'FAQs',
      icon: 'help-circle-outline',
      isSelected: false,
    },
    {
      tab: 'Privacy Policy',
      route: '/home/privacyPolicy',
      props: '/home/privacyPolicy',
      label: 'Privacy Policy',
      icon: 'document-lock-outline',
      isSelected: false,
    },
    {
      tab: 'Terms and Conditions',
      route: '/session/termsConditions',
      props: '/session/termsConditions',
      label: 'Terms and Conditions',
      icon: 'information-circle-outline',
      isSelected: false,
    },
    {
      tab: 'Get Help',
      route: '/home/getHelp',
      props: '/home/getHelp',
      label: 'Get Help',
      icon: 'call-outline',
      isSelected: false,
    },
  ];
  @Input() someInput!: string;

  constructor(
    public router: Router,
    public toasterService: ToasterService,
    private menu: MenuController,
    private enumService: EnumService,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    private stateManagementService: StateManagementService
  ) {
    this.getUserDetailsFromStorage();
    this.loadAvatar();
    this.userDetail();
    this.version = APPLICATION_VERSION;
  }

  ngOnChanges() {
    this.greetMessage = greetHandler();
    this.loadAvatar();
  }

  ngOnInit() {
    this.loadAvatar();
  }

  ionViewDidLeave() {
    console.log("bggb!");
  }

  openFirst() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

  openMenu() {
    this.loadAvatar();
    this.menu.open();
    this.userDetail();
  }

  private loadAvatar() {
    this.profileAvatarUrl =
      this.localStorageService.getItem(storageKeyNameConstants.USER_AVATAR, true) ||
      localStorage.getItem(this.profileImageStorageKey) ||
      '';
  }

  openEnd() {
    this.menu.close();
    this.menu.open('end');
  }

  policyToggler() {
    this.policyExpanded = !this.policyExpanded;
  }

  // child route control click handler
  navigateMenu(path: any) {
    this.openEnd();
    this.router.navigate([`${path}`]);
  }

  // parent route control click handler
  onItemSelected(item: ITabRoutes) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
      this.openEnd();
    }
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
  }

  getUserDetailsFromStorage() {
    this.userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);
  }

  userDetail() {

    this.getUserDetailsFromStorage();

    if (!this.userDetails?.userId || !this.userDetails?.statusEnumId || this.isUserDetailLoading) {
      return;
    }

    this.isUserDetailLoading = true;

    this.subscription.push(
      this.enumService.getUserList(this.userDetails.userId, this.userDetails.statusEnumId).subscribe((res) => {
        this.isUserDetailLoading = false;

        if (res.statusCode === 200) {
          this.hasHandledUnauthorized = false;
          this._userDetails = res.data[0];
        } else if (res.statusCode === 401) {
          if (!this.hasHandledUnauthorized) {
            this.hasHandledUnauthorized = true;
            this.authService.logout();
          }
        } else {
          this.toasterService.presentToast(
            res.message,
            TOASTER_CONSTANTS.WARNING
          );
        }
      }, () => {
        this.isUserDetailLoading = false;
      })
    );
  }

  navigateToUser() {
    this.router.navigate(['/home/profile']);
    this.openEnd();
  }

  logout() {
    this.openEnd();
    this.authService.logout();
  }

  handleSearchControlClick() {
    const showSearchControls = this.stateManagementService.showSearchboxOnMap;
    // console.log(showSearchControls, 'before change');
    this.stateManagementService.updateSearchboxStatus(!showSearchControls);
    this.onSearchControlClick.emit();
  }

  openNotifications() {
    this.showNotificationsPanel = !this.showNotificationsPanel;
  }

  closeNotifications() {
    this.showNotificationsPanel = false;
  }

  ngOnDestroy() {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
    this.userDetails = null;
    this._userDetails = null;
  }
}
