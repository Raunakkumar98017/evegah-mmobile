import { CommonResponse } from 'src/app/core/models/common/common-response-model';

import { IGetCityList } from './getCity';

export interface IGetCity extends CommonResponse {
  data: Array<IGetCityList>;
}
