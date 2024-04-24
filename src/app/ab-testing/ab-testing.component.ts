import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { DataTableComponent } from '../data-table/data-table.component';
import { NotificationUiService } from '../services/notification-ui.service';
import { RetryModalPopupComponent } from '../retry-modal-popup/retry-modal-popup.component';
import { DataTableSearchCriteriaComponent } from '../data-table-search-criteria/data-table-search-criteria.component';

@Component({
  selector: 'app-ab-testing',
  templateUrl: './ab-testing.component.html',
  styleUrls: ['./ab-testing.component.scss'],
})
export class AbTestingComponent implements OnInit {
  @ViewChild('abtesting_search') abtestingSearch: DataTableSearchCriteriaComponent | undefined;
  isAbTesting: boolean = true;
  abTestingTableDetails: any = {
    name: "notification",
    pk: "id",
    search: "",
    filterCriteria: { is_ab_testing: true },
    needServerSidePagination: true,
    skipDefaultApiTrigger: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK", },
      { name: "Category ", attr: "categoryName", width: "135" },
      { name: "Channel", attr: "channels", width: "100", type: "IMAGE_LIST" },
      { name: "Audience % ", attr: "audiencePercentage", width: "135" },
      { name: "Scheduled? ", attr: "isScheduled", width: "100", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135" },
      { name: "Created Time", attr: "createdAt", width: "175" },
      { name: "Sent/Scheduled", attr: "sendOrScheduled", width: "175" },
    ],
    actions: [
      { name: "View Result", attr: 'view', isValid: (el: any) => el.isProcessed },
      { name: "Edit", attr: 'edit', isValid: (el: any) => !el.isProcessed },
      { name: "Clone", attr: 'clone' },
      { name: "Delete", clickFunction: (el: any) => this.confirmDelete(el.id) },
      { name: "Retry", clickFunction: (el: any) => this.confirmationRetry(el.id), isValid: (el: any) => { return (el.status == "FAILED" && this.notifiService.excludeRetryErrorCodeList.indexOf(el.errorCode) == -1) } }
    ],
    getRecord: (params: any) => {
      return this.notifiService.getAllNotification(params, this.isAbTesting)
    },
    buildData: (abTesing: any) => {
      return abTesing.map((abTesing: any) => {
        const channels: any = [];
        if (abTesing.channels.indexOf('EMAIL') !== -1) channels.push({ title: "Email", name: 'mail-outline' });
        if (abTesing.channels.indexOf('WEB_PUSH') !== -1) channels.push({ title: "Web Push", name: 'desktop-outline' });
        if (abTesing.channels.indexOf('MOBILE_PUSH') !== -1) channels.push({ title: "Mobile Push", name: 'phone-portrait-outline' });;
        if (abTesing.channels.indexOf('SMS') !== -1) channels.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (abTesing.channels.indexOf('IN_APP_MESSAGE') !== -1) channels.push({ title: "In App", name: 'apps-outline' });
        return {
          id: abTesing.id,
          categoryName: abTesing.category.name,
          channels: channels,
          errorCode: abTesing.errorCode,
          audiencePercentage: abTesing.variantSettings.audiencePercentage + "%",
          isScheduled: abTesing.isScheduled ? 'yes' : 'no',
          createdAt: this.datePipe.transform(abTesing.createdAt, this.notifiService.date_time_format),
          updatedAt: this.datePipe.transform(abTesing.updatedAt, this.notifiService.date_time_format),
          sendOrScheduled: this.datePipe.transform(abTesing.status === 'TRIGGERED' ? abTesing.processedAt : (abTesing.isScheduled ? abTesing.scheduledAt : null), this.notifiService.date_time_format),
          status: abTesing.status,
          isProcessed: abTesing.isProcessed,
          link: {
            id: abTesing.isProcessed ? '/ab-testing/result/' + abTesing.id : '/ab-testing/' + abTesing.id
          },
          action: {
            view: '/ab-testing/result/' + abTesing.id,
            edit: '/ab-testing/' + abTesing.id,
            clone: '/ab-testing/clone/' + abTesing.id,
          }
        };
      });
    }
  };
  category_search = '';
  isInitTriggered: boolean = false;
  filterCriteria: any = {};

  categoryList: any = [];

  filterFieldList: any = [
    {
      name: 'Status', attr: 'status', type: 'MULTI_SELECT',
      values: [
        { value: 'CREATED', text: 'CREATED' },
        { value: 'TRIGGERED', text: 'TRIGGERED' },
        { value: 'SCHEDULED', text: 'SCHEDULED' },
        { value: 'FAILED', text: 'FAILED' },
      ]
    },
    {
      name: 'Category', attr: 'categoryId', type: 'MULTI_SELECT', isSearchable: true,
      values: []
    },
    { name: 'ID', attr: 'id', type: 'TEXT' },

  ];
  defaultFilterCriteria: any = {
    status: ['CREATED', 'TRIGGERED', 'SCHEDULED', 'FAILED']
  };

  @ViewChild('abTesting_grid') abTesting_grid: DataTableComponent | undefined;

  constructor(public notifiService: NotificationUiService, private datePipe: DatePipe, private alertController: AlertController, private modalctrl: ModalController) {
  }

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
    this.getAllCategory();
  }

  getAllCategory() {
    this.notifiService.getAllActiveCategoryNameList().subscribe({
      next: (categoryList: any) => {
        this.categoryList = categoryList.data;
        this.filterFieldList[1].values = this.categoryList.map((data: any) => {
          return { value: data.id, text: data.name };
        });
        this.abtestingSearch?.init(true);
      },
      error: (err: any) => {
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  async confirmDelete(id: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made will be deleted.',
      message: "<div class='warning-wraper'>" +
        "<div class='warning-title-wrapper'>" +
        "<ion-icon name='warning' class='icon-color'></ion-icon>" +
        "<ion-label class='warning-title'>Warning</ion-label>" +
        "</div>" +
        "<p class='warning-content'>By deleting the notification associated <span class='bold-text'>History</span> details will also removed. </p>" +
        "</div>",

      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Delete',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.deleteNotification(id);
          }
        },
      ],
    });
    alert.setAttribute('style', '--min-width:30vw;');
    await alert.present();
  }

  deleteNotification(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteNotificationById(id, this.isAbTesting).subscribe({
      next: async (data: any) => {
        this.notifiService.toster.success('A/B Testing Deleted successfully!');
        await this.abTesting_grid?.init();
        this.notifiService.hideLoader();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'A/B Testing Delete Failed');
      }
    });
  }
  onClose() {
    this.modalctrl.dismiss();
  }

  async confirmationRetry(id?: any) {
    var subHeaderContent = `Do you  want to retry Id: ${id}`;
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
            if (id) this.individualRetry(id);
          }
        },
      ],
    });
    await alert.present();
  }

  individualRetry(id: any) {
    this.notifiService.showLoader();
    this.notifiService.retryIndividualNotifcation({ 'idList': id }).subscribe({
      next: (e: any) => {
        this.abTestingTableDetails.reload();
        this.notifiService.hideLoader();
        this.notifiService.toster.success('Retry initiated successfully');
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        err.CUSTOM_ERROR_CODE == 1001 ? this.notifiService.toster.error(`Retry is already initiated`) : this.notifiService.toster.error(err.message)
      }
    });
  }
  onSelectedValueChange(selectedValues: any[]) {
    this.filterCriteria.category_id = selectedValues;
  }

  applyFilter(filterCriteria: any) {
    this.abTestingTableDetails.filterCriteria = filterCriteria;
    this.abTesting_grid?.applyFilterCriteria();
  }
}
