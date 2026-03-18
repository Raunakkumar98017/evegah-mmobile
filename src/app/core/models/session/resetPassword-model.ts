import { IResetPassword } from "../../interfaces/session/resetPassword";

export class ResetPassword implements IResetPassword {
  emailId!: string;
}
