import { Component, OnInit, Optional, ViewChild } from '@angular/core';
import { IonRouterOutlet, ModalController, Platform } from '@ionic/angular';

import { AlertController } from '@ionic/angular';

import { NotificationUiService } from '../../services/notification-ui.service';
import { ConfigCategoryDeleteModalComponent } from './config-category-delete-modal/config-category-delete-modal.component';
import { DataTableComponent } from 'src/app/data-table/data-table.component';
import { DataTableSearchCriteriaComponent } from 'src/app/data-table-search-criteria/data-table-search-criteria.component';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-config-category',
  templateUrl: './config-category.html',
  styleUrls: ['./config-category.scss']
})
export class ConfigCategory implements OnInit {

  categoryTableDetails: any = {
    name: "category",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    filterCriteria: {},
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Name", attr: "name", width: "175" },
      { name: "Priority", attr: "priority", width: "135", className: "textCapitalize" },
      // { name: "Time To Live", attr: "ttl", width: "150" },
      { name: "Status", attr: "status", width: "135" },
      { name: "Rate Limit", attr: "rateLimit", width: "135", className: "textCapitalize" },
      { name: "Updated Time", attr: "updatedAt", width: "175" },
    ],
    actions: [
      { name: "Edit", attr: 'edit' },
      { name: "Clone", attr: 'clone' },
      { name: "View Template", attr: 'viewTemplate' },
      { name: "Disable", clickFunction: (el: any) => this.confirmDelete(el, 'disabled') }
    ],
    getRecord: (params: any) => this.notifiService.getAllCategory(params),
    buildData: (categoryList: any) => {
      return categoryList.map((category: any) => {
        return {
          id: category.id,
          name: category.name,
          priority: category.priority,
          status: category.status,
          rateLimit: category.rateLimit || '-',
          updatedAt: this.datePipe.transform(category.updatedAt, this.notifiService.date_time_format),
          link: {
            id: '/configuration/category/' + category.id
          },
          action: {
            edit: '/configuration/category/' + category.id,
            clone: '/configuration/category/clone/' + category.id,
            viewTemplate: '/configuration/template',
            viewTemplateQueryParam: { categoryId: category.id },
          }
        };
      });
    }
  };

  filterFieldList: any = [
    { name: 'ID', attr: 'id', type: 'TEXT' },
    { name: 'Name', attr: 'name-like', type: 'TEXT' },
    {
      name: 'Status', attr: 'status', type: 'MULTI_SELECT',
      values: [
        { value: 'ACTIVE', text: 'ACTIVE' },
        { value: 'DISABLED', text: 'DISABLED' }
      ]
    },
    {
      name: 'Priority', attr: 'priority', type: 'MULTI_SELECT',
      values: [
        { value: 'MANDATORY', text: 'Mandatory' },
        { value: 'LOW', text: 'Low' },
        { value: 'MEDIUM', text: 'Medium' }
      ]
    }
  ];

  @ViewChild('category_grid') categoryGrid: DataTableComponent | undefined;
  @ViewChild('category_search') categorySearch: DataTableSearchCriteriaComponent | undefined;

  defaultFilterCriteria: any = {
    status: ['ACTIVE']
  };

  selectedCategory: any = null;

  @Optional() private routerOutlet?: IonRouterOutlet;

  constructor(public notifiService: NotificationUiService, private modalController: ModalController, private route: Router,
    private alertController: AlertController, private datePipe: DatePipe, public modalctrl: ModalController) {
    this.categoryTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
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
  }

  deleteCategory(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteCategoryById(id).subscribe({
      next: async (data: any) => {
        this.notifiService.toster.success('Category Disabled successfully!');
        await this.categoryGrid?.init();
        this.notifiService.hideLoader();
      },
      error: async (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        if (err.code == 1001) {
          await this.openActionDeniedModel();
        } else {
          this.notifiService.toster.error(err.message || 'Category Disable Failed');
        }
      }
    });
  }

  async confirmDelete(category: any, status?: any) {
    this.selectedCategory = category;
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: `Changes you made will be ${status}.`,
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Disable',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.deleteCategory(category.id);
          }
        },
      ],
    });
    await alert.present();
  }

  async openActionDeniedModel() {
    let categoryList: any = await this.notifiService.getAllActiveCategoryNameList().toPromise();
    const modal = await this.modalController.create({
      component: ConfigCategoryDeleteModalComponent,
      cssClass: 'sizeModal',
      componentProps: {
        category: this.selectedCategory,
        categoryList: categoryList.data.filter((category: any) => category.id != this.selectedCategory.id),
        deleteEvent: (id: any) => {
          this.deleteCategory(id);
        }
      },
      backdropDismiss: false
    });
    await modal.present();

  }

  applyFilter(filterCriteria: any) {
    this.categoryTableDetails.filterCriteria = filterCriteria;
    this.categoryGrid?.applyFilterCriteria();
  }

}
