import { IImageData } from "../../interfaces/common/image-data";

export class ImageData implements IImageData {
  unique_file_name!: string;
  file_name!: string;
  getSingedUrl!: string;
}
