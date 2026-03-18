/* eslint-disable prefer-const */

import * as moment from "moment";
import { MINIMUM_AGE_TO_USE_THE_APPLICATION } from "../constants/common-constant";

// function to validate mobile number
export const validateMobileNumber = (mobileNumber: any) => {
  let regex = new RegExp(/^[6-9]\d{9}$/);

  if (regex.test(mobileNumber)) {
    return false;
  } else {
    return true;
  }
};

export function validateEmail(email: string) {

  if (
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  ) {
    return false;
  }

  return true;

}

export function validateDateOfBirth(date: string) {

  const birthDate = moment(date);
  const difference = moment().diff(birthDate, 'years');

  if (difference < MINIMUM_AGE_TO_USE_THE_APPLICATION) {
    return true;
  }

  return false;
}
