import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HttpErrorInterceptor } from './core/Interceptor/error-handling-interceptor';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoggedInAuthGuard } from './service/guard/loggedIn.guard';
import { AuthGuard } from './service/guard/auth.guard';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { MatStepperModule } from '@angular/material/stepper';
import { NgOtpInputModule } from 'ng-otp-input';
import { Storage } from '@ionic/storage';
import { SharedModule } from './shared/shared.module';


/** Http interceptor providers  */
export const interceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    SharedModule,
    NoopAnimationsModule,
    MatStepperModule,
    HttpClientModule,
    NgOtpInputModule
  ],
  providers: [
    StatusBar,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    interceptorProviders,
    LoggedInAuthGuard,
    AuthGuard,
    Storage,
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule { }
