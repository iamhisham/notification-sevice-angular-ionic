import { Component, OnInit, ViewChild, ElementRef, Input, ChangeDetectionStrategy } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NotificationUiService } from '../services/notification-ui.service';
import { SelectionModel } from '@angular/cdk/collections';



@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DataTableComponent implements OnInit {

  @Input() tableDetails: any;

  displayedColumns: any = [];
  dataSource: any;
  pageSize: any;
  records: any = [];
  disableDotIcon: any;

  totalCount: any;

  currentView_isAllSelected: boolean = false;
  currentView_isInterminateSelected: boolean = false;

  @ViewChild(MatPaginator) paginators!: MatPaginator;
  @ViewChild(MatSort) sorts!: MatSort;

  @ViewChild('mytable', { read: ElementRef }) public widgetsContent!: ElementRef<any>;
  @ViewChild('selectAllCheckbox', { read: ElementRef }) public selectAllCheckbox!: ElementRef<any>;

  isLoading = true;

  constructor(private notifiService: NotificationUiService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.pageSize = 10;
    this.init(this.tableDetails.showLoader == false ? false : true, this.tableDetails.skipDefaultApiTrigger);
    if (this.tableDetails.pageSize) this.pageSize = this.tableDetails.pageSize;
  }

  resetAll() {
    this.records = [];
    this.tableDetails.totalCount = this.totalCount = 0;
    this.tableDetails.selectedIdList = [];
    if (this.dataSource) this.dataSource.data = [];
    this.currentView_isAllSelected = false;
    this.currentView_isInterminateSelected = false;
    if (this.selectAllCheckbox?.nativeElement) {
      var element = this.selectAllCheckbox.nativeElement.querySelector('input[type="checkbox"]');
      if (element.checked) element.click();
    }
  }

  async init(showLoader: boolean = true, skipGetRecords: boolean = false) {
    try {
      this.isLoading = true;
      if (showLoader) this.notifiService.showLoader();
      this.resetAll();
      this.initDataSource();
      if (!skipGetRecords) await this.getRecordsAndLoadData({ page: 1, limit: this.pageSize });
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      this.notifiService.toster.error(err.message || 'Failed');
    }
    this.isLoading = false;
    if (showLoader) this.notifiService.hideLoader();
  }

  getParams(params: any) {
    if (this.tableDetails.needServerSidePagination) {
      Object.keys(this.tableDetails.filterCriteria || {}).forEach((key: string) => {
        var value = this.tableDetails.filterCriteria[key];
        if (value != null) {
          value = value instanceof Array ? value.join(',') : value;
          if (value != '') params[key] = value;
        }
      });
      return params;
    }
    return null;
  }

  async getRecordsAndLoadData(params: any) {
    const result = await this.tableDetails.getRecord(this.getParams(params)).toPromise();
    var data: any = null;
    var totalRecords = null;
    if (result instanceof Array) {
      data = result;
      totalRecords = data.length;
    } else {
      data = result.data;
      totalRecords = result._metadata.totalRecords;
    }
    this.loadData(data, totalRecords);
  }

  initDataSource() {
    if (!this.dataSource) {
      if (this.selectAllCheckbox?.nativeElement) {
        var element = this.selectAllCheckbox.nativeElement.querySelector('input[type="checkbox"]');
        if (!this.currentView_isAllSelected && !this.currentView_isInterminateSelected && element.checked) {
          element.click();
        }
      }
      var _this = this;
      this.tableDetails.reload = async (showLoader?: boolean) => await _this.init(showLoader);
      this.tableDetails.unSelectAll = async () => await _this.unSelectAll();

      this.displayedColumns = this.tableDetails.fields.map((obj: any) => obj.attr);
      if (this.tableDetails.isSelectableGrid) {
        this.displayedColumns.unshift('checkbox');
      }
      if (!this.tableDetails.disableDotIcon) {
        this.displayedColumns.push('final');
      }
      this.dataSource = new MatTableDataSource();
      this.dataSource.sort = this.sorts;
      this.dataSource.paginator = this.paginators;
      this.paginators._intl.itemsPerPageLabel = 'Display';
    }
  }

  loadData(records: any, totalCount: any) {
    this.tableDetails.totalCount = this.totalCount = totalCount;
    this.records = this.records.concat(this.tableDetails.buildData(records));
    this.renderData();
  }

  renderData() {
    this.dataSource.data = this.tableDetails.getFilteredRecords ? this.tableDetails.getFilteredRecords(this.records) : this.records;
    this.search();
    this.tableDetails.isRendered = true;
  }

  search() {
    this.dataSource.filter = (this.tableDetails.search || '').trim().toLowerCase();
    if (!this.dataSource.filter) this.renderPaginationCount();
  }

  async applyFilterCriteria() {
    // this.notifiService.showLoader();
    try {
      if (this.tableDetails.needServerSidePagination) {
        this.resetAll();
        await this.getRecordsAndLoadData({ page: 1 });
      } else {
        this.renderData();
      }
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      // this.notifiService.toster.error(err.message || 'Failed');
    }
    // this.notifiService.hideLoader();
  }

  scrollRight() {
    this.widgetsContent.nativeElement.scrollLeft += 340;
  }

  renderPaginationCount() {
    if (this.totalCount != this.records.length) {
      setTimeout(() => this.paginators.length = this.totalCount, 100);
    }
  }

  async pageChanged(event: PageEvent) {
    if (!this.tableDetails.needServerSidePagination) return;
    var recordCount = this.records.length;
    var currentPageTotalCount = event.pageSize * (event.pageIndex + 1);
    if (this.totalCount != recordCount && currentPageTotalCount > recordCount) {
      // this.notifiService.showLoader();
      try {
        if (this.pageSize !== event.pageSize) {
          this.pageSize = event.pageSize;
          this.records = [];
          await this.getRecordsAndLoadData({ page: event.pageIndex + 1, limit: event.pageSize });
        } else if (this.totalCount != recordCount && currentPageTotalCount > recordCount) {
          await this.getRecordsAndLoadData({ page: event.pageIndex + 1, limit: event.pageSize });
        }
        setTimeout(() => {
          this.paginators.pageIndex = event.pageIndex;
          this.paginators.length = this.totalCount;
          this.notifiService.hideLoader();
          this.updateCurrentViewCheckbox();
        }, 100);

      } catch (err: any) {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    } else {
      this.updateCurrentViewCheckbox();
    }
  }

  selectAllRowInCurrentView(event: any) {
    const { selectedIdList } = this.tableDetails;
    const startRecordIndex = this.paginators.pageIndex * this.paginators.pageSize;
    const endRecordIndex = (this.paginators.pageIndex + 1) * this.paginators.pageSize;

    for (var i = startRecordIndex; i < endRecordIndex && i < this.dataSource.data.length; i++) {
      var element = this.dataSource.data[i];
      var selectedRowId = element[this.tableDetails.pk];
      if (event.checked && this.tableDetails.isCheckboxVisible && !this.tableDetails.isCheckboxVisible(element)) {
        continue;
      }
      var index = selectedIdList.indexOf(selectedRowId);
      if (event.checked && index == -1) {
        selectedIdList.push(selectedRowId);
      } else if (!event.checked && index != -1) {
        selectedIdList.splice(index, 1);
      }
    }
    this.updateCurrentViewCheckbox();
  }

  selectRow(event: any, el: any) {
    const { selectedIdList } = this.tableDetails;
    const selectedRowId = el[this.tableDetails.pk];
    var index = selectedIdList.indexOf(selectedRowId);
    if (event.checked && index == -1) {
      selectedIdList.push(selectedRowId);
    } else if (!event.checked && index != -1) {
      selectedIdList.splice(index, 1);
    }
    this.updateCurrentViewCheckbox();
  }

  unSelectAll() {
    this.tableDetails.selectedIdList = [];
    this.updateCurrentViewCheckbox();
    var element = this.widgetsContent.nativeElement.querySelector("table th:nth-child(2)");
    if (element) {
      element.dispatchEvent(new Event('focus', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  }

  updateCurrentViewCheckbox() {
    const { selectedIdList } = this.tableDetails;
    const startRecordIndex = this.paginators.pageIndex * this.paginators.pageSize;
    const endRecordIndex = (this.paginators.pageIndex + 1) * this.paginators.pageSize;

    const currentViewSelectedList: any = [];
    const currentViewUnSelectedList: any = [];
    for (var i = startRecordIndex; i < endRecordIndex && i < this.dataSource.data.length; i++) {
      var selectedRowId = this.dataSource.data[i][this.tableDetails.pk];
      if (selectedIdList.indexOf(selectedRowId) != -1) {
        currentViewSelectedList.push(selectedRowId);
      } else {
        currentViewUnSelectedList.push(selectedRowId);
      }
    }
    this.currentView_isAllSelected = (currentViewUnSelectedList.length == 0);
    this.currentView_isInterminateSelected = (currentViewSelectedList.length > 0 && currentViewUnSelectedList.length > 0);
    if (this.selectAllCheckbox?.nativeElement) {
      var element = this.selectAllCheckbox.nativeElement.querySelector('input[type="checkbox"]');
      if (!this.currentView_isAllSelected && !this.currentView_isInterminateSelected && element.checked) {
        element.click();
      }
    }
  }
}
