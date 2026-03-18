/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ITabRoutes } from 'src/app/core/interfaces/common/tabRoutes';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  routePath: string = '';
  tabRoutesArray: Array<ITabRoutes> = [
    {
      tab: 'Scan QR',
      route: '/home/ScanQR',
      props: 'ScanQR',
      label: 'Scan QR',
      icon: '../../../assets/images/qrcode.png',
      isSelected: false,
    }
  ];

  constructor(public router: Router) { }

  ngOnInit() {
    this.routePath = this.router.url;
  }

  navigateTabs(path: any) {
    if (path) {
      this.router.navigate([`home/${path}`]);
    } else {
      this.router.navigate(['../home']);
    }
  }
}
