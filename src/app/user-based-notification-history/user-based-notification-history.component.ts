import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { NotificationUiService } from '../services/notification-ui.service';
import { TemplatePageComponent } from '../template-page/template-page.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { Chart } from 'chart.js';
import { RetryModalPopupComponent } from '../retry-modal-popup/retry-modal-popup.component';

@Component({
  selector: 'user-based-notification-history',
  templateUrl: './user-based-notification-history.component.html',
  styleUrls: ['./user-based-notification-history.component.scss'],
})
export class UserBasedNotificationHistoryComponent implements OnInit {

  view: string = 'QUEUE';
  chartList: any = [];
  user: any = {};
  isInitTriggered: boolean = false;
  user_id: any;
  summary: any = {};
  isNoUserError: boolean = false;

  // user segment changes (Error and Failed)
  submittedDeferredSegment: boolean = true;
  submittedErrorViewSegment: boolean = false;
  errorReason: any = {
    isModelOpen: false,
  }
  //Error Notification
  submittedErrorNotificationList: any = {
    name: "submittedErrorNotificationList",
    pk: 'id',
    search: "",
    selectedIdList: [],
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    tableLength: '',
    filterCriteria: { status: "ERROR" },
    isSelectableGrid: true,
    isCheckboxVisible: (el: any) => { return (el.retry_status != 'IN_PROGRESS' && this.notifiService.excludeRetryErrorCodeList.indexOf(el.error_code) == -1) },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notificationId", width: "160", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "135" },
      { name: "Priority", attr: "priority", width: "115", className: "textCapitalize" },
      { name: "Error Code", attr: "errorCode", width: "135", },
      { name: "Retry Count", attr: "retryCount", width: "150" },
      { name: "Retry Status", attr: "retryStatus", width: "150" },
      { name: "Last Retry At ", attr: "lastRetryAt", width: "150" },
      { name: "Created Time", attr: "createdAt", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
      { name: "View Reason", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY', true), isValid: (el: any) => el.status != 'CHANNEL_NOT_FOUND' },
      { name: "Retry", clickFunction: (el: any) => this.confirmationRetry(el.id), isValid: (el: any) => { return (el.retryStatus != 'IN_PROGRESS' && this.notifiService.excludeRetryErrorCodeList.indexOf(el.errorCode) == -1) } }
    ],
    getRecord: (params: any) => this.notifiService.getErrorNotificationHistoryByUserIdWithStatus(this.user_id, params),
    buildData: (sentNotification: any) => {
      return sentNotification.map((sentNotification: any) => {
        var channel: any = [];
        if (sentNotification.channel) {
          if (sentNotification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
          if (sentNotification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
          if (sentNotification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
          if (sentNotification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
          if (sentNotification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        }
        return {
          id: sentNotification.id,
          notificationId: sentNotification.notificationId,
          categoryName: sentNotification.categoryName,
          channel: sentNotification.channel,
          identifier: sentNotification.identifier,
          priority: sentNotification.priority,
          errorCode: sentNotification.errorCode,
          retryCount: sentNotification.retryCount,
          retryStatus: sentNotification.retryStatus,
          lastRetryAt: sentNotification.lastRetryAt,
          createdAt: this.datePipe.transform(sentNotification.createdAt, this.notifiService.date_time_format),
          link: {
            notification_id: '/notification/' + sentNotification.notificationId + '/history'
          },
          action: {}
        };
      });
    }
  };
  //Deferred Notification
  submittedDeferredNotificationList: any = {
    name: "submittedDeferredNotificationList",
    pk: 'id',
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "DEFERRED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notificationId", width: "160", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "150" },
      { name: "Status", attr: "status", width: "135" },
      { name: "Reason", attr: "deferredReason", width: "120" },
      { name: "Scheduled Time", attr: "scheduledAt", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'QUEUED') },
    ],
    getRecord: (params: any) => this.notifiService.getDeferredNotificationByUserIdWithStatus(this.user_id, params),
    buildData: (submitdefer: any) => {
      return submitdefer.map((submitdefer: any) => {
        var channel: any = [];
        if (submitdefer.channel) {
          if (submitdefer.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
          if (submitdefer.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
          if (submitdefer.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
          if (submitdefer.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
          if (submitdefer.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        }
        return {
          id: submitdefer.id,
          notificationId: submitdefer.notificationId,
          categoryName: submitdefer.categoryName,
          channel: channel,
          identifier: submitdefer.identifier,
          priority: submitdefer.priority,
          deferredReason: submitdefer.deferredReason,
          status: submitdefer.status,
          scheduledAt: this.datePipe.transform(submitdefer.scheduledAt, this.notifiService.date_time_format),
          link: {
            notificationId: submitdefer.isAbTesting ? '/ab-testing/result/' + submitdefer.notificationId : '/notification/' + submitdefer.notificationId + '/history'
          },
          action: {

          }
        };
      });
    }
  };
  //Queued Notification
  submittedQueuedNotificationList: any = {
    name: "submittedQueuedNotificationList",
    pk: 'id',
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "QUEUED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notificationId", width: "160", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "150", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135" },
      { name: "Reason", attr: "deferredReason", width: "120" },
      { name: "Scheduled Time", attr: "scheduledAt", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'QUEUED') },
    ],
    getRecord: (params: any) => this.notifiService.getNotificationQueueByUserIdWithStatus(this.user_id, params),
    buildData: (submitdefer: any) => {
      return submitdefer.map((submitdefer: any) => {
        var channel: any = [];
        if (submitdefer.channel) {
          if (submitdefer.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
          if (submitdefer.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
          if (submitdefer.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
          if (submitdefer.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
          if (submitdefer.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        }
        return {
          id: submitdefer.id,
          notificationId: submitdefer.notificationId,
          categoryName: submitdefer.categoryName,
          channel: channel,
          identifier: submitdefer.identifier,
          priority: submitdefer.priority,
          deferredReason: submitdefer.deferredReason,
          status: submitdefer.status,
          scheduledAt: this.datePipe.transform(submitdefer.scheduledAt, this.notifiService.date_time_format),
          link: {
            notificationId: submitdefer.isAbTesting ? '/ab-testing/result/' + submitdefer.notificationId : '/notification/' + submitdefer.notificationId + '/history'
          },
          action: {

          }
        };
      });
    }
  };
  //Delivered Notifiction
  deliveredNotificationList: any = {
    name: "deliveredNotification",
    pk: 'id',
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "SENT,DELIVERED,VIEWED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notificationId", width: "160", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "135" },
      { name: "Priority", attr: "priority", width: "115", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "115" },
      { name: "Created Time", attr: "createdAt", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
    ],
    getRecord: (params: any) => this.notifiService.getNotificationHistoryByUserIdWithStatus(this.user_id, params),
    buildData: (deliveredNotification: any) => {
      return deliveredNotification.map((deliveredNotification: any) => {
        var channel: any = [];
        if (deliveredNotification.channel) {
          if (deliveredNotification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
          if (deliveredNotification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
          if (deliveredNotification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
          if (deliveredNotification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
          if (deliveredNotification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        }
        return {
          id: deliveredNotification.id,
          notificationId: deliveredNotification.notificationId,
          categoryName: deliveredNotification.categoryName,
          channel: channel,
          identifier: deliveredNotification.identifier,
          priority: deliveredNotification.priority,
          status: deliveredNotification.status,
          createdAt: this.datePipe.transform(deliveredNotification.createdAt, this.notifiService.date_time_format),
          link: {
            notificationId: deliveredNotification.isAbTesting ? '/ab-testing/result/' + deliveredNotification.notificationId : '/notification/' + deliveredNotification.notificationId + '/history'
          },
          action: {

          }
        };
      });
    }
  };

  @ViewChild('errorNotification_grid') errorNotificationGrid: DataTableComponent | undefined;
  @ViewChild('queuedNotification_grid') queuedNotificationGrid: DataTableComponent | undefined;
  @ViewChild('sentNotification_grid') sentNotificationGrid: DataTableComponent | undefined;
  @ViewChild('deferredNotification_grid') deferredNotificationGrid: DataTableComponent | undefined;

  constructor(private datePipe: DatePipe, public notifiService: NotificationUiService,
    private modalController: ModalController, private actRouter: ActivatedRoute,
    public loadingCtrl: LoadingController, private alertController: AlertController) { }

  ngOnInit() {
    this.init();
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
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.user_id = param['get']('user_id');
      this.getAllUserProfileByID(this.user_id);
      this.getUserNotificationSummary();
    });
  }

  // new content
  getUserNotificationSummary() {
    this.summary.isLoaded = false;
    this.notifiService.getUserNotificationSummary(this.user_id).subscribe({
      next: (summary: any) => {
        this.summary = summary;
        this.summary.isLoaded = true;
        this.chartList = [];
        const { delivered, submitted } = this.summary;
        this.chartList.push(this.getBarChartData('Email', delivered.channels.EMAIL, submitted.channels.EMAIL));
        this.chartList.push(this.getBarChartData('SMS', delivered.channels.SMS, submitted.channels.SMS));
        this.chartList.push(this.getBarChartData('Web Push', delivered.channels.WEB_PUSH, submitted.channels.WEB_PUSH));
        this.chartList.push(this.getBarChartData('Mobile Push', delivered.channels.MOBILE_PUSH, submitted.channels.MOBILE_PUSH));
        this.chartList.push(this.getBarChartData('In App', delivered.channels.IN_APP_MESSAGE, submitted.channels.IN_APP_MESSAGE));
      },
      error: (err: any) => {
        this.summary = {};
        err = err.error || { err };
      }
    });

  }

  getBarChartData(title: string, deliveredCount: number, submittedCount: number) {
    return {
      title,
      isNotApplicable: deliveredCount == 0 && submittedCount == 0,
      series: [deliveredCount, submittedCount],
      colors: ['var(--chart-series-1)', 'var(--chart-series-2)'],
      chart: {
        type: "donut",
        height: 200
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: title,
                color: 'var(--chart-series-2)',
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'Inter',
                formatter: () => {
                  return deliveredCount + submittedCount;
                }
              }
            }
          }
        },
        radialBar: {
          hollow: {
            size: "50%"
          }
        }
      },
      labels: ['Delivered', 'Submitted'],
      legend: {
        show: false
      }
    }
  }

  viewMessage(id: string, type: string, isErrormessage?: boolean) {
    this.notifiService.showLoader();
    if (type == "HISTORY") {
      this.notifiService.getNotificationHistoryById(id).subscribe((data: any) => {
        if (isErrormessage) {
          this.errorReason = data;
          this.notifiService.hideLoader();
          this.errorReason.isModelOpen = true;
        }
        else {
          this.notifiService.hideLoader();
          this.modalPresent(data);
        }
      });
    } else if (type == "QUEUED") {
      this.notifiService.getNotificationQueueById(id).subscribe((data: any) => {
        this.notifiService.hideLoader();
        this.modalPresent(data);
      });
    }
  }

  async modalPresent(data: any, ErrorReason?: any) {
    try {
      var content = data.content;
      if (data.channel == 'MOBILE_PUSH') {
        if (content.image) content.image = { source_type: 'URL', url: content.image };
      } else if (data.channel == 'WEB_PUSH') {
        if (content.icon) content.icon = { source_type: 'URL', url: content.icon };
        if (content.image) content.image = { source_type: 'URL', url: content.image };
      }
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: ErrorReason ? 'isViewReason' : 'viewMessage',
        componentProps: {
          preview_channel: ErrorReason ? null : data.channel,
          content: content,
          isEmailReadOnly: true,
          attachment_preview: 'HISTORY',
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


  scrollContent(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  // user_id

  getAllUserProfileByID(profileId: any) {
    this.notifiService.showLoader();
    this.notifiService.getAllUserProfileByID(profileId).subscribe({
      next: async (profile: any) => {
        this.user = profile;
        this.isNoUserError = false;
        // this.countValue();
        // var tagObj: any = {};
        // (this.user.tags || []).forEach((tag: any) => tagObj[tag.field] = tag.value);
        // this.attributes = await this.notifiService.getAllAttribute().toPromise();
        // this.attributes.forEach((attribute: any) => attribute.value = tagObj[attribute.name]);
        this.notifiService.hideLoader();
      },
      error: (err: any) => {
        if (err.status == 404) this.isNoUserError = true;
        else {
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || 'Failed')
        };
        this.notifiService.hideLoader();
      }
    });
  }

  switchView(view: string) {
    this.view = view;
  }
  cancel() {
    this.errorReason.isModelOpen = false;
  }
  onWillDismiss(event: Event) {
    // this.cancel();
  }
  individualRetry(id: any) {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualChannel({ 'idList': id }).subscribe({
      next: (e: any) => {
        // this.submittedErrorNotificationList.reload();
        this.notifiService.hideLoader();
        setTimeout(() => { this.openErrorMsgPopup(e, true); }, 1000);
        // setTimeout(() => { this.notifiService.toster.success('Retry initiated successfully'); }, 1000);
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
    var subHeaderContent = `Do you  want to retry${id ? ' Id: ' + id + '?' : ' all error notifications?'}`;
    const alert = await this.alertController.create({
      header: 'Confirmation',
      subHeader: this.submittedErrorNotificationList.selectedIdList.length > 0 && !id ? `Do you  want to retry selected notifications?` : subHeaderContent,
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
            else if (this.submittedErrorNotificationList.selectedIdList.length > 0) this.retrySelected();
            else if (!id) { this.retryAll(); }
          }
        },
      ],
    });
    await alert.present();
  }

  retryAll() {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualUser({ 'idList': this.user_id }).subscribe({
      next: (e: any) => {
        // this.submittedErrorNotificationList.reload();
        this.notifiService.hideLoader();
        setTimeout(() => { this.openErrorMsgPopup(e, true); }, 1000);
        // setTimeout(() => { this.notifiService.toster.success('Retry initiated successfully'); }, 1000);
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
    this.notifiService.retryIndividualChannel({ 'idList': this.submittedErrorNotificationList.selectedIdList }).subscribe({
      next: (e: any) => {
        // this.submittedErrorNotificationList.reload();
        this.notifiService.hideLoader();
        this.openErrorMsgPopup(e, true);
        // this.notifiService.toster.success('Retry initiated successfully');
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.openErrorMsgPopup(err, false);
        // err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message)
      }
    });
  }

  async reloadAll() {
    this.notifiService.showLoader();
    await Promise.all([
      this.submittedQueuedNotificationList.reload(false),
      this.submittedDeferredNotificationList.reload(false),
      this.submittedErrorNotificationList.reload(false),
      this.deliveredNotificationList.reload(false),
      this.getUserNotificationSummary()
    ]);
    this.notifiService.hideLoader();
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
        this.submittedErrorNotificationList.reload();
      }
    })
    await modal.present();
  }
}
