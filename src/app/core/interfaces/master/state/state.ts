import { CommonResponse } from 'src/app/core/models/common/common-response-model';

import { IGetStateList } from './getState';

export interface IGetState extends CommonResponse {
  data: Array<IGetStateList>;
}
