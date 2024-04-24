import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-data-table-search-criteria',
  templateUrl: './data-table-search-criteria.component.html',
  styleUrls: ['./data-table-search-criteria.component.scss']
})

export class DataTableSearchCriteriaComponent implements OnInit {
  maxDate = new Date();
  @Input() filterFieldList: any = [];
  filterFieldMap: any = {};
  filterCriteria: any = {};
  previousFilterCriteria: any = {};
  @Input() defaultFilterCriteria: any = {}
  @Output() applySearch: EventEmitter<any> = new EventEmitter<any>();

  constructor(public modalctrl: ModalController, public notifiService: NotificationUiService) { }

  ngOnInit() {
    this.init();
  }

  init(triggerSearch: boolean = false) {
    this.filterFieldList.forEach((field: any) => {
      this.filterFieldMap[field.attr] = field;
      if ((field.type == "MULTI_SELECT") && field.isSearchable && !this.defaultFilterCriteria[field.attr] && field.values && field.values.length > 0) {
        this.defaultFilterCriteria[field.attr] = field.values.map((obj: any) => obj.value);
      }
    });
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    this.previousFilterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    if (triggerSearch) {
      this.searchByFilter();
    }
  }

  isFilterCriteriaChanged() {
    var source = this.previousFilterCriteria;
    var dest = this.filterCriteria;
    return Object.keys(this.filterFieldMap).find((key: string) => {
      var sourceVal = source[key] || "";
      var destVal = dest[key] || "";
      sourceVal = sourceVal instanceof Array ? sourceVal.join(",") : sourceVal;
      destVal = destVal instanceof Array ? destVal.join(",") : destVal;
      return sourceVal != destVal;
    }) != null;
  }

  onSearch() {
    if (this.isFilterCriteriaChanged()) {
      this.previousFilterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.searchByFilter();
    }
    // this.modalctrl.dismiss();
  }

  onReset() {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    if (this.isFilterCriteriaChanged()) {
      this.previousFilterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.searchByFilter();
    }
  }

  searchByFilter() {
    const filterCriteria: any = {};
    Object.entries(this.filterCriteria).forEach(([key, value]) => {
      if (value && (!(value instanceof Array) || this.filterFieldMap[key].values.length != value.length)) {
        filterCriteria[key] = value;
      }
    });
    this.applySearch.emit(filterCriteria);
  }

  onSelectedValueChange(attr: string, selectedValues: any[]) {
    this.filterCriteria[attr] = selectedValues;
  }

  onInputChange(event: any) {
    if (this.filterCriteria.startToEnddateTime) this.filterCriteria.startToEnddateTime = this.notifiService.onInputChange(event);
    if (this.filterCriteria.startToEnddateTime.length == 0) {
      this.filterCriteria.start_date = '';
      this.filterCriteria.end_date = '';
    }
  }

}
