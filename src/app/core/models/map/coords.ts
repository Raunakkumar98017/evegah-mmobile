export class Coords {
  /**
   * Latitude
   *
   * @type {number}
   * @memberof Coords
   */
  lat!: number;

  /**
   * Longitude
   *
   * @type {number}
   * @memberof Coords
   */
  lng!: number;

  constructor(props: any) {
    if (props) {
      this.lat = props.lat || null;
      this.lng = props.lng || null;
    }
  }
}
