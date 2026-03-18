import { v4 as uuidv4 } from 'uuid';

/**
 * The Base Model
 * ensures that every model has a random uuid
 *
 * @export
 * @class BaseModel
 */
export class BaseModel {
  id!: string;
  constructor(props?: any) {
    if (props) {
      this.id = props.id || uuidv4();
    }
  }
}
