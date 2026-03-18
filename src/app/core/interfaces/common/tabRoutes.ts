export interface ITabRoutes {
  tab: string;
  route: string;
  props: any;
  label: string;
  icon: string;
  isSelected: boolean;
  children?: ITabRoutes[];
}
