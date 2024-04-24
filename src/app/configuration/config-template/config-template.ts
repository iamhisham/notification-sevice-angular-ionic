import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { NotificationUiService } from 'src/app/services/notification-ui.service';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { DataTableComponent } from 'src/app/data-table/data-table.component';
import { DatePipe } from '@angular/common';
import { DataTableSearchCriteriaComponent } from 'src/app/data-table-search-criteria/data-table-search-criteria.component';

@Component({
  selector: 'app-config-template',
  templateUrl: './config-template.html',
  styleUrls: ['./config-template.scss'],
})
export class ConfigTemplate implements OnInit {

  templateTableDetails: any = {
    name: "template",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    skipDefaultApiTrigger: true,
    filterCriteria: {},
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Template Name", attr: "name", width: "175" },
      { name: "Category", attr: "category", width: "175" },
      { name: "Status", attr: "status", width: "175" },
      { name: "Channels", attr: "channels", width: "175", type: "IMAGE_LIST" },
      { name: "Updated Time", attr: "updatedAt", width: "175" }
    ],
    actions: [
      { name: 'Edit', attr: "edit" },
      { name: 'Clone', attr: "clone" },
      { name: 'Disable', clickFunction: (el: any) => this.confirmDelete(el, 'disabled') }
    ],
    getRecord: (params: any) => this.notifiService.getAllTemplate(params),
    buildData: (templateList: any) => {
      return templateList.map((template: any) => {
        var channels: any = [];
        if (template.channels.indexOf('EMAIL') !== -1) channels.push({ title: "Email", name: 'mail-outline' });
        if (template.channels.indexOf('WEB_PUSH') !== -1) channels.push({ title: "Web Push", name: 'desktop-outline' });
        if (template.channels.indexOf('MOBILE_PUSH') !== -1) channels.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (template.channels.indexOf('SMS') !== -1) channels.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (template.channels.indexOf('IN_APP_MESSAGE') !== -1) channels.push({ title: "In App", name: 'apps-outline' });

        return {
          id: template.id,
          name: template.name,
          category: template.category.name,
          status: template.status,
          channels: channels,
          updatedAt: this.datePipe.transform(template.updatedAt, this.notifiService.date_time_format),
          link: {
            id: '/configuration/template/' + template.id
          },
          action: {
            edit: '/configuration/template/' + template.id,
            clone: '/configuration/template/clone/' + template.id,
          },
          additionalData: {
            categoryId: template.categoryId
          }
        };
      });
    }
  };

  @ViewChild('template_grid') templateGrid: DataTableComponent | undefined;
  @ViewChild('template_search') templateSearch: DataTableSearchCriteriaComponent | undefined;

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
      name: 'Category', attr: 'categoryId', type: 'MULTI_SELECT', isSearchable: true,
      values: []
    },

  ];
  selectedCategotyList: any = [];

  selectedTemplate: any = null;
  category_search: string = "";
  mobile_Category_Search: string = "";
  categoryList: any = [];

  filteredCategoryList: any = [];
  hideSearch: any = false;
  dataSource: any;
  defaultFilterCriteria: any = {
    status: ['ACTIVE']
  };
  filterCriteria: any = {};
  isInitTriggered: boolean = false;

  constructor(public notifiService: NotificationUiService, private toastController: ToastController, private alertController: AlertController,
    private actRouter: ActivatedRoute, private datePipe: DatePipe, public modalctrl: ModalController) {
    this.templateTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
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
    this.actRouter.queryParams.subscribe((params: Params) => {
      this.getAllCategory(params['category_id']);
    });
  }

  getAllCategory(category_id: any) {
    this.notifiService.getAllActiveCategoryNameList().subscribe({
      next: (categoryList: any) => {
        this.categoryList = categoryList.data;
        this.filterFieldList.find((fields: any, index: any) => {
          if (fields.attr === 'categoryId') {
            this.filterFieldList[index].values = this.categoryList.map((data: any) => {
              return { value: data.id, text: data.name };
            });
          }
        });
        if (category_id) this.defaultFilterCriteria.categoryId = [Number(category_id)];
        else delete this.defaultFilterCriteria.categoryId;
        this.templateSearch?.init(true);
        if (this.templateTableDetails.isRendered) this.loadedTemplateData();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  loadedTemplateData() {
    this.templateGrid?.applyFilterCriteria();
  }

  deleteTemplate(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteTemplateById(id).subscribe({
      next: async (data: any) => {
        this.notifiService.toster.success("Template Disabled successfully!");
        await this.templateGrid?.init();
        this.notifiService.hideLoader();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || "Template disable Failed");
      }
    });
  }

  async confirmDelete(template: any, status?: any) {
    this.selectedTemplate = template;
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
            this.deleteTemplate(template.id);
          }
        },
      ],
    });
    await alert.present();
  }

  removeCategorydata(categoryID: any, type?: any) {
    if (categoryID) {
      this.selectedCategotyList.splice(this.selectedCategotyList.findIndex((data: any) => data === categoryID), 1);
    } else {
      this.selectedCategotyList = this.categoryList.map((category: any) => category.id);
    }

    if (type != undefined) {
      this.selectedCategotyList = [];
    }
    this.loadedTemplateData();
  }

  hideAndSearch() {
    this.hideSearch = !this.hideSearch;
    this.category_search = "";
  }

  categoryFilter() {
    if (this.category_search != '') {
      let categoryList = this.categoryList.filter((categoryList: any) => { return categoryList.name.includes(this.category_search) });
      return categoryList.length == 0 ? true : false;
    }
    return false;
  }
  onClose() {
    this.modalctrl.dismiss();
  }


  applyFilter(filterCriteria: any) {
    this.templateTableDetails.filterCriteria = filterCriteria;
    this.templateGrid?.applyFilterCriteria();
  }
}
