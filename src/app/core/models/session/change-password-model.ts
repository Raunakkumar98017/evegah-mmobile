import { IChangePassword } from "../../interfaces/session/change-password";

export class ChangePassword implements IChangePassword {
  emailId!: string;
  oldPassword!: string;
  newPassword!: string;
}
