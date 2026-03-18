import { FormGroup } from '@angular/forms';
import CryptoJS from 'crypto-js';

import { environment } from 'src/environments/environment';

// custom validator to check that two fields match
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      // return if another validator has already found an error on the matchingControl
      return;
    }
    // set error on matchingControl if validation fails
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}

// function to generate random 4 digits otp
export function generateRandomOtp() {
  return Math.floor(1000 + Math.random() * 9000);
}

/**
 * function to handle the greet like Good morning, Good Afternoon, Good Evening
 * according to current time of the system
 * @returns greet message
 */
export const greetHandler = () => {
  let myDate: Date = new Date();
  let hrs: number = myDate.getHours();

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  let greet: string = '';

  if (hrs < 12) {
    greet = 'Good Morning';
  } else if (hrs >= 12 && hrs <= 16) {
    greet = 'Good Afternoon';
  } else if (hrs >= 16 && hrs <= 24) {
    greet = 'Good Evening';
  }
  return greet;
};

export const calcPercentageFromNumber = (number: number, total: number) => {
  let percentage = (number / total) * 100;
  return Math.round(percentage * 100) / 100;
};

export const calcAverageRatingOfProduct = (
  star1: number,
  star2: number,
  star3: number,
  star4: number,
  star5: number,
  total: number
) => {
  let average = (star1 * 1 + star2 * 2 + star3 * 3 + star4 * 4 + star5 * 5) / total;
  return Math.round(average * 10) / 10;
};

export const encryptValueIntoCipherValue = (value: any) => {

  const encryptionKey: string = environment.AES_ENCRYPTION_KEY;
  let cipherText = CryptoJS.AES.encrypt(value, encryptionKey).toString();

  return cipherText;

};

export const decryptCipherValueIntoPlainValue = (data: any) => {

  const decryptionKey: string = environment.AES_ENCRYPTION_KEY;
  let bytes = CryptoJS.AES.decrypt(data, decryptionKey);
  let decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  return decryptedData;

};