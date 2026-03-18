import { ILogin } from "../../interfaces/session/login";
export class Login implements ILogin {
  emailId!: string;
  password!: string;

}
