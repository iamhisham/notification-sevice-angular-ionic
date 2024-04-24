import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { Chart, ChartComponent } from 'chart.js';
import { ApexNonAxisChartSeries, ApexPlotOptions, ApexChart } from 'ng-apexcharts';
import { SegmentViewPopupComponent } from 'src/app/segment-view-popup/segment-view-popup.component';
import { NotificationUiService } from '../../services/notification-ui.service';
import { TemplatePageComponent } from '../../template-page/template-page.component';
import { RetryModalPopupComponent } from 'src/app/retry-modal-popup/retry-modal-popup.component';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: any;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-ab-testing-result',
  templateUrl: './ab-testing-result.component.html',
  styleUrls: ['./ab-testing-result.component.scss'],
})
export class AbTestingResultComponent implements OnInit {

  notification_id: string = '';
  notification: any = {};
  chartHeight: number = 250;
  preview_channel_attr_map: any = {
    'EMAIL': 'email_content',
    'WEB_PUSH': 'web_push_content',
    'MOBILE_PUSH': 'push_content',
    'SMS': 'sms_content',
    'IN_APP_MESSAGE': 'in_app_content'
  }

  isAbtestingSupported = true;
  constructor(private actRouter: ActivatedRoute, public notifiService: NotificationUiService, private modalController: ModalController, private alertController: AlertController) { }

  isInitTriggered: boolean = false;
  ngOnInit() {
    this.init();
    if (screen.width < 375) {
      this.chartHeight = 200;
    }
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
      this.notifiService.showLoader();
      try {
        var summary: any = null;
        [this.notification, summary] = await Promise.all(['getNotificationById', 'getABTestingSummary'].map(async (functionName: any) => {
          if (functionName == 'getNotificationById') return await this.getNotificationById();
          else if (functionName == 'getABTestingSummary') return await this.getABTestingSummary();
        }));
        if (this.notification && this.notification.variantList && summary) {
          var colorList = ['var(--chart-series-2)', 'var(--chart-series-1)'];
          this.notification.variantList.forEach((variant: any, index: number) => {
            variant.history_link = '/ab-testing/' + this.notification_id + '/history/' + variant.id;
            variant.summary = {
              sent: this.getChartData(summary[variant.id].sent.percentage, summary[variant.id].sent.userCount, 'Sent rate', colorList[index]),
              opened: this.getChartData(summary[variant.id].viewed.percentage, summary[variant.id].viewed.userCount, 'Opened rate', colorList[index])
            }
          });
        }
      } catch (err: any) {
        if (err.status == 400) { this.isAbtestingSupported = false }
        else {
          this.notifiService.toster.error(err.message || err);
        }
      }
      this.notifiService.hideLoader();
    });
  }

  async getNotificationById() {
    var notification: any = await this.notifiService.getNotificationById(this.notification_id, true).toPromise();
    notification.includedUserSegmentList_str = (notification.includedUserSegmentList || []).map((el: any) => el.name).join(', ');
    notification.excludedUserSegmentList_str = (notification.excludedUserSegmentList || []).map((el: any) => el.name).join(', ');
    return notification;
  }

  async getABTestingSummary() {
    var abTestingSummary: any = {};
    var abTestingSummaryList: any = await this.notifiService.getABTestingSummary(this.notification_id).toPromise();
    abTestingSummaryList.forEach((variant: any) => abTestingSummary[variant.variant_id] = variant);
    return abTestingSummary;
  }

  getChartData(value: number, userCount: number, label: string, color: string) {
    return {
      colors: [color],
      series: [value],
      chart: {
        height: this.chartHeight,
        type: 'radialBar'
      },
      tooltip: {
        enabled: true,
        custom: function () {
          return '<div>' +
            '<span>' + label + ' : ' + userCount + '</span>' +
            '</div>'
        },
        y: {
          formatter: undefined,
          title: {
            formatter: (seriesName) => seriesName,
          },
        },
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '50%'
          }
        }
      },
      labels: [label],
      legend: {
        show: false
      }
    }
  }

  // modal popup / preview 1001
  async openPreview(tempId: any, channel: string) {
    try {
      this.notifiService.showLoader();
      var content: any = await this.notifiService.getTemplateById(tempId).toPromise();
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: channel,
          content: content[this.preview_channel_attr_map[channel]],
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

  retryAll() {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualNotifcation({ 'idList': this.notification_id }).subscribe({
      next: (e: any) => {
        setTimeout(() => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success('Retry initiated successfully');
          // this.openErrorMsgPopup(e, true);
        }, 1000)
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        // this.openErrorMsgPopup(err, false);
        err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message)
      }
    });
  }

  async confirmationRetry() {
    var subHeaderContent = `Do you  want to retry all error Notifications?`;
    const alert = await this.alertController.create({
      header: 'Confirmation',
      subHeader: subHeaderContent,
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
            this.retryAll();
          }
        },
      ],
    });
    await alert.present();
  }

  // async openErrorMsgPopup(response: any, isSuccess: boolean = false) {
  //   const modal = await this.modalController.create({
  //     component: RetryModalPopupComponent,
  //     cssClass: 'retry-modal-popup',
  //     backdropDismiss: false,
  //     componentProps: { response, isSuccess }
  //   });
  //   await modal.present();
  // }


}
