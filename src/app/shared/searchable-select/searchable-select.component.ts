import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { ISearchableSelectDataModel } from 'src/app/core/interfaces/common/shared-component';

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.scss']
})
export class SearchableSelectComponent implements OnInit, OnChanges {

  @Input() data!: Array<ISearchableSelectDataModel>;
  @Input() selectedValue!: ISearchableSelectDataModel | null;
  @Input() placeholder!: string;
  @Input() disabled!: boolean;
  @Output() onSelect = new EventEmitter<ISearchableSelectDataModel>();

  displayOptions: boolean = false;
  optionsList!: Array<ISearchableSelectDataModel>;
  selectBoxLabel: string = '';
  searchQuery: string = '';

  constructor() { }

  ngOnInit() {
    this.data = this.handleSelectedPropertyChange(this.data, this.selectedValue);
    this.optionsList = [...this.data];
    this.selectBoxLabel = this.selectedValue ? this.selectedValue.label : this.placeholder;
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['selectedValue']) {
      this.data = this.handleSelectedPropertyChange(this.data, changes['selectedValue'].currentValue);
      this.optionsList = [...this.data];
      this.selectBoxLabel = changes['selectedValue'].currentValue?.label;
    }

    if (changes['data']) {
      this.data = this.handleSelectedPropertyChange(changes['data'].currentValue, this.selectedValue);
      this.optionsList = [...this.data];
      this.selectBoxLabel = this.selectedValue ? this.selectedValue.label : this.placeholder;
    }

  }

  handleSelectBoxControlClick() {

    if (this.disabled === true) {
      return;
    }

    this.displayOptions = !this.displayOptions;

  }

  closeModel() {
    this.displayOptions = false;
  }

  handleSearchInput(event: any) {

    const query = event.target.value.toLowerCase();

    this.searchQuery = query;
    this.optionsList = this.data.filter((item: ISearchableSelectDataModel) => {
      return item.label.toLowerCase().indexOf(query) > -1;
    });

  }

  handleSelectedPropertyChange(data: Array<ISearchableSelectDataModel>, selectedValue: ISearchableSelectDataModel | null) {

    const _data = data.map((item: ISearchableSelectDataModel) => {

      // if selectedValue is available and its value flag matched with item.value flag
      // set selected property to true
      if (selectedValue && selectedValue.value === item.value) {
        return { ...item, selected: true };
      }

      return { ...item, selected: false };

    });

    return _data;

  }

  handleItemClick(selectedItem: ISearchableSelectDataModel) {
    this.optionsList = this.handleSelectedPropertyChange(this.optionsList, selectedItem);
    this.closeModel();
    this.onSelect.emit(selectedItem);
    this.searchQuery = '';
  }

}
