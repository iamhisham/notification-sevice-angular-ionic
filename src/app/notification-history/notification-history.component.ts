import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationUiService } from '../services/notification-ui.service';
import { format, parseISO } from 'date-fns';
import { AlertController, ModalController } from '@ionic/angular';
import { TemplatePageComponent } from '../template-page/template-page.component';
import { DatePipe } from '@angular/common';
import { RetryModalPopupComponent } from '../retry-modal-popup/retry-modal-popup.component';
@Component({
  selector: 'app-notification-history',
  templateUrl: './notification-history.component.html',
  styleUrls: ['./notification-history.component.scss'],
})
export class NotificationHistoryComponent implements OnInit {

  isViewReason: boolean = false;
  retryValidList = ['ERR-3001', 'ERR-3002', 'ERR-4001'];
  isNotificationSupported: any = true;

  //Error Table Data.
  submittedErrorNotificationList: any = {
    name: "submittedErrorNotificationList",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "ERROR" },
    isSelectableGrid: true,
    isCheckboxVisible: (el: any) => { return (el.retry_status != 'IN_PROGRESS' && this.notifiService.excludeRetryErrorCodeList.indexOf(el.error_code) == -1) },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "customerId", width: "100", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "175" },
      { name: "Error Code", attr: "errorCode", width: "135" },
      { name: "Retry Count", attr: "retryCount", width: "150" },
      { name: "Retry Status", attr: "retryStatus", width: "150" },
      { name: "Last Retry At ", attr: "lastRetryAt", width: "150" },
      { name: "Created Time", attr: "createdAt", width: "175" },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
      { name: "View Reason", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY', true), isValid: (el: any) => el.status != 'CHANNEL_NOT_FOUND' },
      { name: "Retry", clickFunction: (el: any) => this.confirmationRetry(el.id), isValid: (el: any) => { return (el.retry_status != 'IN_PROGRESS' && this.notifiService.excludeRetryErrorCodeList.indexOf(el.errorCode) == -1) } }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationHistoryErrorDetailByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationHistoryErrorDetailByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          custoerId: notification.customerId,
          categoryName: notification.categoryName,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          errorCode: notification.errorCode,
          retryCount: notification.retryCount,
          retryStatus: notification.retryStatus,
          lastRetryAt: notification.lastRetryAt,
          createdAt: this.datePipe.transform(notification.createdAt, this.notifiService.date_time_format),
          link: {
            customerId: '/user-profile/' + notification.customerId + '/history'
          },
          action: {}
        };
      });
    }
  };
  //Queued Table Data.
  submittedQueuedNotificationList: any = {
    name: "submittedQueuedNotificationList",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "QUEUED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "customerId", width: "135", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "150", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135", },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'QUEUED') }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationQueueByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationQueueByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          customerId: notification.customerId,
          categoryName: notification.categoryName,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          status: notification.status,
          link: {
            customerId: '/user-profile/' + notification.customerId + '/history'
          },
          action: {}
        };
      });
    }
  };
  //Differed Table Data.
  submittedDeferredNotificationList: any = {
    name: "submittedDeferredNotificationList",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "DEFERRED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "customerId", width: "135", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "150", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135", },
      { name: "Reason", attr: "deferredReason", width: "120" },
      { name: "Scheduled Time", attr: "scheduledAt", width: "175" },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'QUEUED') }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationDifferedByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationDifferedByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          customerId: notification.customerId,
          categoryName: notification.categoryName,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          status: notification.status,
          deferredReason: notification.deferredReason,
          scheduledAt: this.datePipe.transform(notification.scheduledAt, this.notifiService.date_time_format),
          link: {
            customerId: '/user-profile/' + notification.customerId + '/history'
          },
          action: {}
        };
      });
    }
  };
  //Delivered Notification Table Data.
  deliveredNotificationList: any = {
    name: "deliveredNotification",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "SENT,DELIVERED,VIEWED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "customerId", width: "115", type: "LINK" },
      { name: "Category", attr: "categoryName", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "120", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "120", },
      { name: "Sent Time", attr: "sentAt", width: "175" },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationHistoryByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationHistoryByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          customerId: notification.customerId,
          categoryName: notification.categoryName,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          status: notification.status,
          sent_at: this.datePipe.transform(notification.sentAt, this.notifiService.date_time_format),
          link: {
            customerId: '/user-profile/' + notification.customerId + '/history'
          },
          action: {}
        };
      });
    }
  };

  chartList: any = [];
  isAbTesting: boolean = false;
  notification: any = {};
  notification_id: string = '';
  variant_id: string = '';
  isDirectContentMessage: boolean = false;
  summary: any = {};

  preview_channel_attr_map: any = {
    'EMAIL': 'email_content',
    'WEB_PUSH': 'web_push_content',
    'MOBILE_PUSH': 'push_content',
    'SMS': 'sms_content',
    'IN_APP_MESSAGE': 'in_app_content'
  }
  view: string = 'QUEUE';

  errorReason: any = {
    isModelOpen: false,
  }
  filteredList: any;
  tableLength: any;
  refreshingGrid: boolean = true;

  constructor(public notifiService: NotificationUiService, private actRouter: ActivatedRoute,
    private router: Router, private modalController: ModalController, public datePipe: DatePipe, private alertController: AlertController) {

    this.isAbTesting = this.router.url.startsWith('/ab-testing');
  }
  isInitTriggered: boolean = false;
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
    this.actRouter.paramMap.subscribe(async (param: Params) => {
      this.notification_id = param['get']('notification_id');
      this.variant_id = param['get']('variant_id');
      this.notifiService.showLoader();
      try {
        await Promise.all(['getNotificationById', 'getNotificationSummary'].map(async (functionName: any) => {
          if (functionName == 'getNotificationById') await this.getNotificationById();
          else if (functionName == 'getNotificationSummary') await this.getNotificationSummary();
        }));
      } catch (err: any) {
        if (err.status == 400) { this.isNotificationSupported = false }
        else {
          this.notifiService.toster.error(err.message || err);
        }
      }
      this.notifiService.hideLoader();
    });
  }
  async getNotificationById() {
    this.notification = await this.notifiService.getNotificationById(this.notification_id, this.isAbTesting).toPromise();
    this.notification.includedSegment_str = (this.notification.includedSegment || []).map((el: any) => el.name).join(", ");
    this.notification.excludedSegment_str = (this.notification.excludedSegment || []).map((el: any) => el.name).join(", ");
    if (this.notification.template_id) {
      this.isDirectContentMessage = false;
    } else {
      this.isDirectContentMessage = true;
    }
  }
  async getNotificationSummary() {
    this.summary.isLoaded = false;
    if (this.isAbTesting) {
      this.summary = await this.notifiService.getABTestingSummaryByVariant(this.notification_id, this.variant_id).toPromise();
      this.summary.isLoaded = true;
    } else {
      this.summary = await this.notifiService.getNotificationSummary(this.notification_id).toPromise();
      this.summary.isLoaded = true;
    }
    this.chartList = [];
    const { delivered, submitted } = this.summary;

    this.chartList.push(this.getBarChartData('Email', delivered.channels.EMAIL, submitted.channels.EMAIL));
    this.chartList.push(this.getBarChartData('SMS', delivered.channels.SMS, submitted.channels.SMS));
    this.chartList.push(this.getBarChartData('Web Push', delivered.channels.WEB_PUSH, submitted.channels.WEB_PUSH));
    this.chartList.push(this.getBarChartData('Mobile Push', delivered.channels.MOBILE_PUSH, submitted.channels.MOBILE_PUSH));
    this.chartList.push(this.getBarChartData('In App', delivered.channels.IN_APP_MESSAGE, submitted.channels.IN_APP_MESSAGE));
  }

  getBarChartData(title: string, deliveredCount: number, submittedCount: number) {
    return {
      title,
      isNotApplicable: deliveredCount == 0 && submittedCount == 0,
      series: [deliveredCount, submittedCount],
      colors: ['var(--chart-series-1)', 'var(--chart-series-2)'],
      chart: {
        type: "donut",
        height: 200,
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
        },
      },
      labels: ['Delivered', 'Submitted'],
      legend: {
        show: false,
      }
    }
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
      } else if (type == "QUEUED") {
        var data: any = await this.notifiService.getNotificationQueueById(id).toPromise();
        this.modalPresent(data);
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
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: ErrorReason ? 'isViewReason' : 'viewMessage',
        componentProps: {
          preview_channel: ErrorReason ? null : data.channel,
          content: content,
          attachment_preview: 'HISTORY',
          isEmailReadOnly: true,
          isViewReason: ErrorReason,
          isPreviewPopup: true,
          attachment_details: data,
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
  async openPreview(channel: string) {
    try {
      this.notifiService.showLoader();
      var content: any = null;
      var template_id = this.notification.template_id;
      if (this.isAbTesting) {
        var template_id = this.notification.variantList.find((obj: any) => obj.id == this.variant_id).template_id;
      }
      if (template_id) {
        const resp: any = (await this.notifiService.getTemplateById(template_id).toPromise());
        content = resp[this.preview_channel_attr_map[channel]];
      } else {
        content = this.notification.content;
      }
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: channel,
          content: content,
          isEmailReadOnly: true,
          isPreviewPopup: true
        },
        backdropDismiss: false
      });
      await modal.present();
    } catch (err: any) {
      this.notifiService.hideLoader();
      this.notifiService.toster.error(err.message || err);
    }
  }
  // segment changes function
  switchView(view: string) {
    this.view = view;
  }

  cancel() {
    this.errorReason.isModelOpen = false;
  }

  async confirmationRetry(id?: any, isFromFailedView?: any) {
    var subHeaderContent = `Do you  want to retry${id ? ' Id: ' + id + '?' : isFromFailedView ? ' this Notifications?' : ' all error Notifications?'}`;
    const alert = await this.alertController.create({
      header: 'Confirmation',
      subHeader: this.submittedErrorNotificationList.selectedIdList.length > 0 && !id ? `Do you  want to retry selected notifications ? ` : subHeaderContent,
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
            else if (!id) this.retryAll();

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
        this.notifiService.hideLoader();
        // this.submittedErrorNotificationList.reload();
        // setTimeout(() => { this.notifiService.toster.success('Retry initiated successfully'); }, 1000);
        setTimeout(() => { this.openErrorMsgPopup(e, true); }, 1000);
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.openErrorMsgPopup(err, false);
        // err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message)
      }
    });
  }

  retryAll() {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualNotifcation({ 'idList': this.notification_id }).subscribe({
      next: (e: any) => {
        // this.submittedErrorNotificationList.reload();
        setTimeout(() => {
          this.notifiService.hideLoader();
          // this.notifiService.toster.success('Retry initiated successfully');}, 1000);
          this.openErrorMsgPopup(e, true);
        }, 1000);
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
        this.notifiService.hideLoader();
        // this.submittedErrorNotificationList.reload();
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

  async reloadAll() {
    this.notifiService.showLoader();
    await Promise.all([
      this.submittedQueuedNotificationList.reload(false),
      this.submittedDeferredNotificationList.reload(false),
      this.submittedErrorNotificationList.reload(false),
      this.deliveredNotificationList.reload(false),
      this.getNotificationSummary()
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
