import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-get-help',
  templateUrl: './get-help.component.html',
  styleUrls: ['./get-help.component.scss'],
})
export class GetHelpComponent implements OnInit {
  pageTitle: string = 'Get Help';

  constructor(private router: Router) { }

  ngOnInit() { }

  openWhatsApp() {
    const phoneNumber = '918980966376';
    const message = encodeURIComponent("Hello Evegah Support, I need help with...");
    // Using _system to ensure it opens the native app on mobile
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_system');
  }
}