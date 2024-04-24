import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';
import { AlertController, ModalController } from '@ionic/angular';
import { DataTableComponent } from '../data-table/data-table.component';
import { DatePipe } from '@angular/common';
import { DataTableSearchCriteriaComponent } from '../data-table-search-criteria/data-table-search-criteria.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  userProfileTableDetails: any = {
    name: "userprofile",
    pk: 'id',
    search: "",
    filterCriteria: {},
    needServerSidePagination: true,
    skipDefaultApiTrigger: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Name", attr: "name", width: "175" },
      { name: "Gender", attr: "gender", width: "75", className: "textCapitalize" },
      { name: "Language", attr: "language", width: "100", className: "textCapitalize" },
      { name: "Role", attr: "role", width: "100", className: "textCapitalize" },
      { name: "Created Time", attr: "createdAt", width: "150" },
      { name: "Updated Time", attr: "updatedAt", width: "200" }
    ],
    actions: [
      { name: 'View / Edit', attr: "edit" },
      { name: 'View Notification', attr: "view_notification" },
      { name: 'Delete', clickFunction: (el: any) => this.confirmDelete(el, 'deleted') }
    ],
    getRecord: (params: any) => this.notifiService.getAllUserProfile(params),
    buildData: (userProfileList: any) => {
      return userProfileList.map((userprofile: any) => {
        return {
          id: userprofile.id,
          name: userprofile.name,
          gender: userprofile.gender,
          dateOfBirth: this.datePipe.transform(userprofile.dateOfBirth, this.notifiService.date_format),
          language: userprofile.language,
          role: userprofile.role,
          createdAt: this.datePipe.transform(userprofile.createdAt, this.notifiService.date_time_format),
          updatedAt: this.datePipe.transform(userprofile.updatedAt, this.notifiService.date_time_format),
          link: {
            id: '/user-profile/' + userprofile.id
          },
          action: {
            edit: '/user-profile/' + userprofile.id,
            view_notification: '/user-profile/' + userprofile.id + '/history',
          }
        };
      });
    }
  };

  @ViewChild('user_profile_grid') userProfileGrid: DataTableComponent | undefined;
  @ViewChild('userprofile_search') userProfileSearch: DataTableSearchCriteriaComponent | undefined;


  listOfTags: any;
  defaultFilterCriteria: any = {
    role: ['ADMIN']
  };
  filterFieldList: any = [
    {
      name: 'User Type', attr: 'role', type: 'MULTI_SELECT',
      values: [
        { value: 'USER', text: 'USER' },
        { value: 'ADMIN', text: 'ADMIN' }
      ]
    },
    { name: 'Email', attr: 'email', type: 'TEXT' },
    { name: 'Phone Number', attr: 'telephone_number', type: 'TEXT' },
    { name: 'Device Identifier', attr: 'identifier', type: 'TEXT' },
    { name: 'Tags', attr: 'tags', type: 'MULTI_SELECT', isSearchable: true, values: [] },
    { name: 'Values', attr: 'tag_value', type: 'TEXT' }
  ];
  constructor(public notifiService: NotificationUiService, private alertController: AlertController,
    private datePipe: DatePipe, public modalctrl: ModalController) {
    this.userProfileTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
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
    this.getAllAttribute();
  }

  // delete
  deleteUserProfileById(user: any) {
    this.notifiService.showLoader();
    if (user.role == 'ADMIN') {
      this.notifiService.deleteAdminById(user.id).subscribe({
        next: async (data: any) => {
          this.notifiService.toster.success('Admin Profile Deleted successfully!');
          await this.userProfileGrid?.init();
          this.notifiService.hideLoader();
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || 'Admin Profile Deleted Failed');
        }
      });
    } else {
      this.notifiService.deleteUserProfileById(user.id).subscribe({
        next: async (data: any) => {
          this.notifiService.toster.success('User Profile Deleted successfully!');
          await this.userProfileGrid?.init();
          this.notifiService.hideLoader();
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || 'User Profile Deleted Failed');
        }
      });
    }
  }

  getAllAttribute() {
    this.notifiService.getAllAttribute().subscribe({
      next: (data: any) => {
        this.listOfTags = data.data;
        this.filterFieldList.find((fields: any, index: any) => {
          if (fields.attr === 'tags') {
            this.filterFieldList[index].values = this.listOfTags.map((data: any) => {
              return { value: data.id, text: data.name };
            });
          }
        });
        this.userProfileSearch?.init(true);
        if (this.userProfileTableDetails.isRendered) this.loadedTemplateData();
      },
      error: (err: any) => {
        err = err.error?.error || err.error || err;
      }
    });
  }

  async confirmDelete(user: any, status?: any) {
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
          text: 'Delete',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.deleteUserProfileById(user);
          }
        },
      ],
    });
    await alert.present();
  }

  onClose() {
    this.modalctrl.dismiss();
  }
  applyFilter(filterCriteria: any) {
    this.userProfileTableDetails.filterCriteria = filterCriteria;
    this.userProfileGrid?.applyFilterCriteria();
  }
  loadedTemplateData() {
    this.userProfileGrid?.applyFilterCriteria();
  }
}


