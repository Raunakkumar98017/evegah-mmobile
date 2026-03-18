import { ICommonResponse } from '../../interfaces/common/common-response';

export class CommonResponse implements ICommonResponse {
  message!: string;
  status!: string;
  statusCode!: number;
}
