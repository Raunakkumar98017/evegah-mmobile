import { Coords } from './coords'
import { BaseModel } from "./base-model";
export class Todo extends BaseModel {

  /**
   * The name of the task (Descriptive)
   *
   * @type {string}
   * @memberof Todo
   */
  name!: string;

  /**
   * Coordinates of the task
   *
   * @type {Coords}
   * @memberof Todo
   */
  coords!: Coords;

  /**
   * Flag used to determine if the task is in edit mode
   *
   * @type {boolean}
   * @memberof Todo
   */
  editMode!: boolean;

  /**
   * Flag to determine if the task has been completed
   *
   * @type {boolean}
   * @memberof Todo
   */
  completed!: boolean;

  /**
   * Flag to determine if the task has been unsaved (ie. is new and in the 'buffer' editor)
   *
   * @type {boolean}
   * @memberof Todo
   */
  unsaved!: boolean;

  constructor(props?: any) {
    super(props);
    if (props) {
      this.name = props.name || null;
      this.coords = props.coords || null;
      this.editMode = props.editMode || false;
      this.completed = props.completed || false;
      this.unsaved = props.unsaved || false;
    }
  }
}
