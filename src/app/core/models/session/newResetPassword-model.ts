import { INewResetPassword } from "../../interfaces/session/newResetPassword";
export class NewResetPassword implements INewResetPassword {
    password!: string;
    token!: string;

}
