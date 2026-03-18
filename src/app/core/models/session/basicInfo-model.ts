import { IBasicInfo } from '../../interfaces/session/basicInfo';

export class BasicInfoModel implements IBasicInfo {
  userId!: number;
  userName!: string;
  referralCode!: string;
  mobile!: string;
  stateId!: number;
  cityId!: number;
  statusEnumId!: number;
  address!: string;
  emailId!: string;
  dateOfBirth!: string;
  genderEnumId!: number;
}
