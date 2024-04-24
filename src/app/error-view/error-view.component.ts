import { Observable } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';
import { DatePipe } from '@angular/common';

import { DataTableComponent } from '../data-table/data-table.component';
import { AlertController, ModalController } from '@ionic/angular';
import { TemplatePageComponent } from '../template-page/template-page.component';

import * as moment from 'moment';
import { RetryModalPopupComponent } from '../retry-modal-popup/retry-modal-popup.component';
import { DataTableSearchCriteriaComponent } from '../data-table-search-criteria/data-table-search-criteria.component';

@Component({
  selector: 'app-error-view',
  templateUrl: './error-view.component.html',
  styleUrls: ['./error-view.component.scss'],
})
export class ErrorViewComponent implements OnInit {
  maxDate = new Date();

  @ViewChild('dateRange') dateRange: any;
  @ViewChild('error_display_grid') errorDisplayGrid: DataTableComponent | undefined;
  @ViewChild('error_count_display_grid') errorCountDisplayGrid: DataTableComponent | undefined;

  error: any = {};
  isErrorModalOpen: boolean = false;
  showErrorCount: boolean = false;
  errorCodeList = [
    { value: 'ERR-2001', text: 'ERR-2001' },
    { value: 'ERR-2002', text: 'ERR-2002' },
    { value: 'ERR-2003', text: 'ERR-2003' },
    { value: 'ERR-3001', text: 'ERR-3001' },
    { value: 'ERR-3002', text: 'ERR-3002' },
    { value: 'ERR-3003', text: 'ERR-3003' },
    { value: 'ERR-4001', text: 'ERR-4001' },
    { value: 'ERR-4002', text: 'ERR-4002' },
    { value: 'ERR-4003', text: 'ERR-4003' },
    { value: 'ERR-4101', text: 'ERR-4101' },
    { value: 'ERR-4102', text: 'ERR-4102' },
    { value: 'ERR-4201', text: 'ERR-4201' },
    { value: 'ERR-4301', text: 'ERR-4301' },
    { value: 'ERR-5001', text: 'ERR-5001' },
    { value: 'ERR-6001', text: 'ERR-6001' },
  ];
  errorcode_search = '';
  isSelectAll: boolean = false;
  totalErrorCount: number = 0;
  errorReason: any = {
    isModelOpen: false,
  }

  channelErrorList: any = {
    name: "channelErrorList",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    skipDefaultApiTrigger: true,
    showLoader: false,
    pageSize: 10,
    filterCriteria: { status: "ERROR" },
    customActionDropdown: true,
    isSelectableGrid: true,
    isCheckboxVisible: (el: any) => { return (el.retry_status != 'IN_PROGRESS' && this.notifiService.excludeRetryErrorCodeList.indexOf(el.error_code) == -1) },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Customer", attr: "customerId", width: "115", type: "LINK" },
      { name: "Notification", attr: "notificationId", width: "115", type: "LINK" },
      { name: "Channel", attr: "channel", width: "75", type: "IMAGE_LIST" },
      { name: "Priority", attr: "priority", width: "115" },
      { name: "Category", attr: "categoryName", width: "135" },
      { name: "Error Code", attr: "errorCode", width: "120", },
      { name: "Retry Count", attr: "retryCount", width: "125" },
      { name: "Retry Status", attr: "retryStatus", width: "130" },
      { name: "Last Retry At ", attr: "lastRetryAt", width: "160" },
      { name: "Created Time", attr: "createdAt", width: "140" },
    ],
    actions: [
      { name: "View Notification Message", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
      { name: "View Error Message", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY', true), isValid: (el: any) => el.status != 'CHANNEL_NOT_FOUND' },
      { name: "Retry", clickFunction: (el: any) => this.confirmationRetry(el.id), isValid: (el: any) => { return (el.retry_status != 'IN_PROGRESS' && this.notifiService.excludeRetryErrorCodeList.indexOf(el.errorCode) == -1) } }
    ],
    getRecord: (params: any) => this.notifiService.getAllHistoryError(params),
    buildData: (historyList: any) => {
      return historyList.map((history: any, index: any) => {
        let channel: any = [];
        if (history.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (history.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (history.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (history.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (history.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        console.log(history, "history");
        return {
          id: history.id,
          customerId: history.customerId,
          notificationId: history.notificationId,
          channel: channel,
          isScheduled: history.isScheduled ? 'yes' : 'no',
          priority: history.priority,
          categoryName: history.categoryName,
          errorCode: history.errorCode,
          retryCount: history.retryCount,
          retryStatus: history.retryStatus,
          lastRetryAt: this.datePipe.transform(history.lastRetryAt, this.notifiService.date_time_format),
          createdAt: this.datePipe.transform(history.createdAt, this.notifiService.date_time_format),
          link: {
            customerId: '/user-profile/' + history.customerId + '/history',
            notificationId: history.isAbTesting ? '/ab-testing/result/' + history.notificationId : '/notification/' + history.notificationId + '/history'
          },
          action: {}
        };
      });
    }
  };

  filterFieldList: any = [
    { name: 'ID', attr: 'id', type: 'TEXT' },
    {
      name: 'Error Code', attr: 'errorCode', type: 'MULTI_SELECT', isSearchable: true,
      values: this.errorCodeList
    },
    {
      name: 'Retry Status', attr: 'retryStatus', type: 'MULTI_SELECT',
      values: [
        { value: 'N/A', text: 'N/A' },
        { value: 'IN PROGRESS', text: 'IN PROGRESS' },
        { value: 'FAILED', text: 'FAILED' }
      ]
    },
    {
      name: 'Select Channel', attr: 'channel', type: 'MULTI_SELECT',
      values: [
        { value: 'EMAIL', text: 'Email' },
        { value: 'WEB_PUSH', text: 'Web Push' },
        { value: 'MOBILE_PUSH', text: 'Mobile Push' },
        { value: 'SMS', text: 'SMS' }
      ]
    },
    {
      name: 'Start to End (Date & Time)', attr: 'startToEnddateTime', type: 'DATE_AND_TIME',
      values: []
    },
    { name: 'Customer ID', attr: 'customerId', type: 'TEXT' },
    { name: 'Notification ID', attr: 'notificationId', type: 'TEXT' }
  ];

  @ViewChild('channelError_grid') channelError_grid: DataTableComponent | undefined;
  @ViewChild('error_page') errorPageSearch: DataTableSearchCriteriaComponent | undefined;

  errorViewList: any = {
    name: "errorViewList",
    pk: "id",
    showLoader: true,
    search: "",
    pageSize: 10,
    disableDotIcon: true,
    fields: [
      { name: "Error Code", attr: "error_Code", width: "75" },
      { name: "Error Message", attr: "error_msg", width: "175" },
      { name: "Retry", attr: "error_retry", width: "175" }
    ],
    getRecord: (params: any) => this.notifiService.errorViewList(params),
    buildData: (errorList: any) => {
      return errorList.map((error: any) => {
        return {
          error_Code: error.error_code,
          error_msg: error.error_msg,
          error_retry: error.error_retry
        }
      });
    }
  }
  //Error Detail View List Table.
  errorDetailViewList: any = {
    name: "errorDetailViewList",
    pk: "id",
    showLoader: true,
    search: "",
    pageSize: 10,
    disableDotIcon: true,
    fields: [
      { name: "Error Code", attr: "error_Code", width: "75" },
      { name: "Error Message", attr: "error_msg", width: "175" },
      { name: "Retry", attr: "error_retry", width: "175" },
      { name: "Count", attr: "count", width: "175" }
    ],
    getRecord: (params: any) => this.getErrorCountList(),
    buildData: (errorList: any) => {
      return errorList.map((error: any) => {
        return {
          error_Code: error.error_code,
          error_msg: error.error_msg,
          error_retry: error.error_retry,
          count: error.count
        }
      });
    }
  }

  isInitTriggered: boolean = false;
  filterCriteria: any = {};
  defaultFilterCriteria: any = {};

  constructor(public notifiService: NotificationUiService, private datePipe: DatePipe, public modalCrtl: ModalController, private alertController: AlertController,
    private modalController: ModalController) {
    this.setLast7DaysDates();
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    this.channelErrorList.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
  }

  ngOnInit() {
    this.init();
    this.getErrorHistoryCount();
  }

  ionViewWillEnter() {
    this.init();
  }

  ionViewWillLeave() {
    this.isInitTriggered = false;
    this.notifiService.closeAllAlertCtrl();
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.renderTableData();
  }

  isFilterCriteriaChanged() {
    var source: any;
    if (this.filterCriteria.startToEnddateTime && this.filterCriteria.startToEnddateTime.length == 2) {
      this.filterCriteria.start_date = moment(this.filterCriteria.startToEnddateTime[0]).format('MM-DD-YYYY HH:mm:ss');
      this.filterCriteria.end_date = moment(this.filterCriteria.startToEnddateTime[1]).format('MM-DD-YYYY HH:mm:ss');
    }
    source = this.channelErrorList.filterCriteria;
    var dest = this.filterCriteria;
    const fieldList = ["error_code", "retry_status", "channel", "start_date", "end_date", "user_id", "notification_id", "id"];
    return fieldList.find((key: string) => {
      var sourceVal = (source[key] || "");
      var destVal = (dest[key] || "");
      sourceVal = sourceVal instanceof Array ? sourceVal.join(",") : sourceVal;
      destVal = destVal instanceof Array ? destVal.join(",") : destVal;
      return sourceVal != destVal;
    }) != null;
  }

  onSearch() {
    if (this.isFilterCriteriaChanged()) {
      this.channelErrorList.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.channelError_grid?.applyFilterCriteria();
      this.getErrorHistoryCount();
    }
    this.modalCrtl.dismiss();
  }

  onReset() {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    if (this.isFilterCriteriaChanged()) {
      this.channelErrorList.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.channelError_grid?.applyFilterCriteria();
      this.getErrorHistoryCount();
    }
  }

  async getErrorHistoryCount() {
    this.error.isLoaded = false;
    this.notifiService.getErrorHistoryCount(this.channelErrorList.filterCriteria).subscribe({
      next: (history: any) => {
        this.error = history;
        this.error.isLoaded = true;
      },
      error: (err: any) => {
        err = err.error?.error || err.error || err;
      }
    });
  }

  async viewMessage(id: string, type: string, isErrormessage?: boolean) {
    this.notifiService.showLoader();
    try {
      if (type == "HISTORY") {
        var data: any = await this.notifiService.getNotificationHistoryById(id).toPromise();
        if (isErrormessage) {
          this.errorReason = data;
          this.errorReason.isModelOpen = true;
        } else {
          this.modalPresent(data);
        }
      }
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
    this.notifiService.hideLoader();
  }

  async modalPresent(data?: any, ErrorReason?: any) {
    try {
      var content = data.content;
      if (data.channel == 'MOBILE_PUSH') {
        if (content.image) content.image = { source_type: 'URL', url: content.image };
      } else if (data.channel == 'WEB_PUSH') {
        if (content.icon) content.icon = { source_type: 'URL', url: content.icon };
        if (content.image) content.image = { source_type: 'URL', url: content.image };
      }
      this.notifiService.hideLoader();
      var modal = await this.modalCrtl.create({
        component: TemplatePageComponent,
        cssClass: ErrorReason ? 'isViewReason' : 'viewMessage',
        componentProps: {
          preview_channel: ErrorReason ? null : data.channel,
          content: content,
          isEmailReadOnly: true,
          isViewReason: ErrorReason,
          isPreviewPopup: true
        },
        backdropDismiss: false
      });
      if (ErrorReason !== undefined && ErrorReason === null) throw { message: "No error message available" }
      await modal.present();
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }
  onClose() {
    this.modalCrtl.dismiss();
  }

  clearValue() {
    this.filterCriteria.startToEnddateTime = [];
  }

  retryAll() {
    this.notifiService.showLoader();
    this.notifiService.retryAllHistory(this.channelErrorList.filterCriteria).subscribe({
      next: (e: any) => {
        // this.channelErrorList.reload();
        this.notifiService.hideLoader();
        // this.notifiService.toster.success('Retry initiated successfully');
        this.openErrorMsgPopup(e, true);
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.openErrorMsgPopup(err, false);
        // err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message)
      }
    });
  }

  retrySelected() {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualChannel({ 'idList': this.channelErrorList.selectedIdList }).subscribe({
      next: (e: any) => {
        // this.channelErrorList.reload();
        this.notifiService.hideLoader();
        // this.notifiService.toster.success('Retry initiated successfully');
        this.openErrorMsgPopup(e, true);
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.openErrorMsgPopup(err, false);
        // err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message)
      }
    });
  }

  async confirmationRetry(id?: any) {
    var subHeaderContent = `Do you  want to retry${id ? ' Id: ' + id + '?' : ' all error Notifications?'}`;
    const alert = await this.alertController.create({
      header: 'Confirmation',
      subHeader: this.channelErrorList.selectedIdList.length > 0 && !id ? `Do you  want to retry selected notifications?` : subHeaderContent,
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'No',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Yes',
          cssClass: 'alert-button-confirm',
          handler: () => {
            if (id) this.individualRetry(id);
            else if (this.channelErrorList.selectedIdList.length > 0) this.retrySelected();
            else if (!id) { this.retryAll(); }
          }
        },
      ],
    });
    await alert.present();
  }

  individualRetry(id: any) {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualChannel({ 'idList': id }).subscribe({
      next: (e: any) => {
        // this.channelErrorList.reload();
        this.notifiService.hideLoader();
        // this.notifiService.toster.success('Retry initiated successfully');
        this.openErrorMsgPopup(e, true);
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.openErrorMsgPopup(err, false);
        // err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message);
      }
    });
  }

  setLast7DaysDates() {
    const startDate = moment().startOf("day").subtract(7, "days");
    const endDate = moment();
    this.defaultFilterCriteria.startToEnddateTime = [new Date(startDate.valueOf()), new Date(endDate.valueOf())];
    this.defaultFilterCriteria.start_date = startDate.format('MM-DD-YYYY HH:mm:ss');
    this.defaultFilterCriteria.end_date = endDate.format('MM-DD-YYYY HH:mm:ss');
  }

  closeErrorMessage() {
    this.errorReason.isModelOpen = false;
    // this.errorReason.data = '';
  }

  async openErrorMsgPopup(response: any, isSuccess: boolean = false) {
    const modal = await this.modalController.create({
      component: RetryModalPopupComponent,
      cssClass: 'retry-modal-popup',
      backdropDismiss: false,
      componentProps: { response, isSuccess }
    });
    modal.onDidDismiss().then(() => {
      if (isSuccess) {
        this.reloadAll();
      }
    })
    await modal.present();
  }

  async reloadAll() {
    await Promise.all([
      this.channelErrorList.reload(true),
      this.getErrorHistoryCount()
    ]);
  }
  getErrorCountList() {
    return new Observable((subscriber: any) => {
      var _this = this;
      async function fetchData() {
        var errorCountList: any = await _this.notifiService.getErrorCountDetail(_this.filterCriteria).toPromise();
        const errorCodeDetailList = _this.notifiService.errorCodeList.filter((mapObject: any) => {
          const matchingErrorCount = errorCountList.find((errorCount: any) => errorCount.errorCode === mapObject.error_code);
          if (matchingErrorCount) {
            mapObject.count = matchingErrorCount.count;
            return true;
          }
          return false;
        });
        _this.totalErrorCount = 0;
        errorCodeDetailList.forEach((obj: any) => { _this.totalErrorCount += obj.count });
        subscriber.next(errorCodeDetailList);
        subscriber.complete();
      }
      fetchData();
    });
  }

  openErrorView(showErrorCount: boolean) {
    this.showErrorCount = showErrorCount;
    this.isErrorModalOpen = true;
  }
  onInputChange(event: any) {
    if (this.filterCriteria.startToEnddateTime) this.filterCriteria.startToEnddateTime = this.notifiService.onInputChange(event);
    if (this.filterCriteria.startToEnddateTime.length == 0) {
      this.filterCriteria.start_date = '';
      this.filterCriteria.end_date = '';
    }
  }
  onSelectedValueChange(selectedValues: any[]) {
    this.filterCriteria.error_code = selectedValues;
  }

  applyFilter(filterCriteria: any) {
    this.channelErrorList.filterCriteria = filterCriteria;
    this.channelError_grid?.applyFilterCriteria();
  }

  renderTableData() {
    setTimeout(async () => {
      this.errorPageSearch?.init(true);
      if (this.channelErrorList.isRendered) this.loadedTemplateData();
    }, 200);
  }

  loadedTemplateData() {
    this.channelError_grid?.applyFilterCriteria();
  }

}
