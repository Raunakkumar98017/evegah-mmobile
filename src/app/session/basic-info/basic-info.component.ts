/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BasicInfoModel } from 'src/app/core/models/session/basicInfo-model';
import { EnumService } from 'src/app/core/services/enum.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpinnerService } from 'src/app/core/services/spinner.services';
import { AuthService } from 'src/app/service/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import storageKeyNameConstants from 'src/app/core/constants/storage-keyname-constants';
import { AlertController } from '@ionic/angular';
import { validateDateOfBirth, validateEmail } from 'src/app/core/helper/form-validation-helper';
import messageConstants from 'src/app/core/constants/message-constants';
import * as moment from 'moment';
import { ISearchableSelectDataModel } from 'src/app/core/interfaces/common/shared-component';
import { TOASTER_CONSTANTS } from 'src/app/core/constants/common-constant';

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss'],
})
export class BasicInfoComponent implements OnInit, OnDestroy {

  mobileNumber: string = '';
  userId: any = '';
  stateData: any = [];
  subscription: Subscription[] = [];
  cityData: any = [];
  enumData: any = [];
  registrationForm!: FormGroup;
  basicInfoModel = new BasicInfoModel();
  currentDate = moment().format('YYYY-MM-DD');
  selectedState: any = null;
  selectedCity: any = null;
  editProfile: boolean = false;

  constructor(
    public router: Router,
    private enumService: EnumService,
    public toasterService: ToasterService,
    private sessionService: SessionService,
    private formBuilder: FormBuilder,
    public spinnerService: SpinnerService,
    public authService: AuthService,
    public activatedRoute: ActivatedRoute,
    public alertController: AlertController,
    private localStorageService: LocalStorageService
  ) {

  }

  ionViewWillEnter() {
  }

  ngOnInit() {

    let _userDetails: any;

    this.userId = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS).userId;
    this.mobileNumber = this.localStorageService.getItem(storageKeyNameConstants.MOBILE_NUMBER);

    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['profileData']) {
        this.editProfile = true;
        _userDetails = JSON.parse(params['profileData']);
      }
    });

    this.setFormControls(_userDetails);
    this.getState();

    if (_userDetails?.stateId) {
      this.getCity(_userDetails?.stateId);
    }

  }

  setFormControls(_userDetails: any) {

    const userName = _userDetails?.userName ? _userDetails?.userName : '';
    const dob = _userDetails?.dateOfBirth ? moment(_userDetails?.dateOfBirth).format('YYYY-MM-DD') : '';
    const email = _userDetails?.emailId ? _userDetails?.emailId : '';
    const address = _userDetails?.address ? _userDetails?.address : '';
    const state = _userDetails?.stateId ? _userDetails?.stateId : '0';
    const city = _userDetails?.cityId ? _userDetails?.cityId : '0';

    if (_userDetails) {

      this.selectedState = {
        label: _userDetails.stateName,
        value: _userDetails.stateId,
        selected: true
      };

      this.selectedCity = {
        label: _userDetails.cityName,
        value: _userDetails.cityId,
        selected: true
      };

    }

    this.registrationForm = this.formBuilder.group({
      userId: this.userId,
      referralCode: [''],
      emailId: [email],
      userName: [userName, Validators.required],
      address: [address],
      stateId: [state],
      cityId: [city],
      dateOfBirth: [dob, Validators.required],
      genderEnumId: ['14', Validators.required],
      statusEnumId: ['1', Validators.required],
      mobile: [this.mobileNumber, Validators.required],
      termsConditions: [false]
    });
  }

  backNavigation() {
    this.router.navigate(['home/profile']);
  }

  getState() {
    this.subscription.push(
      this.enumService.getState(101).subscribe((res) => {
        if (res.statusCode === 200) {
          this.stateData = this.parseStateData(res.data);
        } else {
          this.showAlert(res.message);
        }
      })
    );
  }

  getCity(stateId: number) {
    this.subscription.push(
      this.enumService.getCity(stateId).subscribe((res) => {
        if (res.statusCode === 200) {
          this.cityData = this.parseCityData(res.data);
        } else {
          this.showAlert(res.message);
        }
      })
    );
  }

  stateChange(item: ISearchableSelectDataModel) {
    this.selectedState = item;
    this.registrationForm.patchValue({
      stateId: item.value,
      cityId: '',
    });
    this.cityData = [];
    this.getCity(+item.value);
  }

  cityChange(item: ISearchableSelectDataModel) {
    this.selectedCity = item;
    this.registrationForm.patchValue({
      cityId: item.value,
    });
  }

  // back to previous page
  backBtn() {
    let path = 'home';
    this.router.navigate([path]);
  }

  // navigate to home page function
  proceedHandler() {
    const formValue = this.registrationForm.value;

    if (formValue.emailId && validateEmail(formValue.emailId) === true) {
      this.showAlert(messageConstants.pleaseEnterValidEmail);
    } else if (validateDateOfBirth(formValue.dateOfBirth) === true) {
      this.showAlert(messageConstants.minimumAgeToUseTheApplication);
    } else if (this.editProfile === false && formValue.termsConditions === false) {
      this.showAlert(messageConstants.agreedToTermsAndCond);
    } else {
      this.registrationHandler();
    }

  }

  updateStorageUserDetails(data: any) {

    const userDetails = this.localStorageService.getItem(storageKeyNameConstants.USER_DETAILS);

    const storageData = {
      ...userDetails,
      address: data.address,
      autoGenUserReferralCode: data.autoGenUserReferralCode,
      emailId: data.emailId,
      status: data.status,
      statusEnumId: data.statusEnumId,
      userType: data.userType,
      userName: data.userName
    };

    return storageData;
  }

  registrationHandler() {
    this.spinnerService.presentLoading();
    let first = this.registrationForm.value.userName.substr(0, 1).toUpperCase();
    this.registrationForm.value.userName = first + this.registrationForm.value.userName.substr(1)
    this.subscription.push(
      this.sessionService.userRegistration(this.registrationForm.value).subscribe((res) => {

        if (res.statusCode === 200) {

          const storageData = this.updateStorageUserDetails(res.data[0]);

          this.localStorageService.setItem(storageKeyNameConstants.USER_DETAILS, storageData);
          this.localStorageService.setItem(storageKeyNameConstants.REGISTRATION_STATUS, true);
          this.spinnerService.dismissLoading();

          this.router.navigate(['home']);

          if (this.editProfile === true) {
            this.toasterService.presentToast(
              'Profile updated successfully',
              TOASTER_CONSTANTS.SUCCESS
            );
          }

        } else {
          this.spinnerService.dismissLoading();
          this.showAlert(res.message);
        }
      })
    );
  }

  skipButton() {
    this.router.navigate(['home']);
  }

  parseStateData(stateList: Array<any>) {
    const states = stateList.map((state: any) => ({ label: state.state_name, value: state.state_id }))
    return states;
  }

  parseCityData(cityList: Array<any>) {
    const cities = cityList.map((city: any) => ({ label: city.city_name, value: city.city_id }))
    return cities;
  }

  navigateToTermsCondition() {
    this.router.navigate(['../session/termsConditions']);
  }

  async showAlert(message: string) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: ['OK'],
    });

    await alert.present();

  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
  }
}
