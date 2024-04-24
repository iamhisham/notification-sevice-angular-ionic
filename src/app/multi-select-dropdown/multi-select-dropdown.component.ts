import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-multi-select-dropdown',
  templateUrl: './multi-select-dropdown.component.html',
  styleUrls: ['./multi-select-dropdown.component.scss'],
})
export class MultiSelectDropdownComponent implements OnInit {

  @Input() dropdownList: any = [];
  @Input() placeholder: string = '';
  @Input() optionValue: string = '';
  @Input() optionDisplayName: string = '';
  @Input() selectedValue: any = [];
  @Output() selectedValueChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  showSelectAll: boolean = false;
  isSelectAll: any = false;
  isIntermediate: any = false;
  searchData: string = '';
  allSelected: boolean = false;
  constructor() { }

  ngOnInit() {

  }

  selectedAllValue() {
    var selectedValue: any = [].concat(this.selectedValue);
    var dropdownList = this.getFilterDropdownList();
    var isSelectAll = dropdownList.find((item: any) => selectedValue.indexOf(item[this.optionValue]) == -1) != null

    dropdownList.forEach((item: any) => {
      var value = item[this.optionValue];
      var matchedIndex = selectedValue.indexOf(value);
      if (isSelectAll) {
        if (matchedIndex == -1) selectedValue.push(value);
      } else {
        if (matchedIndex != -1) selectedValue.splice(matchedIndex, 1);
      }
    });
    this.selectedValue = selectedValue;
    this.onSelectionChange();
  }

  getFilterDropdownList(): any[] {
    var list = this.searchData ? this.dropdownList.filter((item: any) => item[this.optionDisplayName].toLowerCase().includes(this.searchData.toLowerCase())) : this.dropdownList;
    this.showSelectAll = list.length > 0;
    return list;
  }

  updateSelectAll(){
    this.isSelectAll = null;
    this.isIntermediate = null;
    setTimeout(() => {
      this.isSelectAll = this.dropdownList.length == this.selectedValue.length;
      this.isIntermediate = !this.isSelectAll && this.selectedValue.length > 0;
    }, 0)
  }

  onSelectionChange() {
    this.updateSelectAll();
    this.selectedValueChange.emit(this.selectedValue);
  }

}
