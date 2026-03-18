import { CommonResponse } from 'src/app/core/models/common/common-response-model';

import { IGetSectionItem } from './section-item';

export interface IGetSectionList extends CommonResponse {
  data: Array<IGetSectionItem>;
}
