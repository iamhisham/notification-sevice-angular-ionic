import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { DataTableComponent } from '../data-table/data-table.component';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-segment-view-popup',
  templateUrl: './segment-view-popup.component.html',
  styleUrls: ['./segment-view-popup.component.scss'],
})
export class SegmentViewPopupComponent implements OnInit {

  @Input() usersegementRules: any;
  @Input() userName: any;
  @Input() type: any;
  isAdminScreen: boolean = false;
  campaignsDetail: any = [];
  isOpen = false;
  userProfileTableDetails: any = {
    name: "userprofile",
    pk: 'id',
    search: "",
    filterCriteria: {},
    needServerSidePagination: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Name", attr: "name", width: "175" },
      { name: "Gender", attr: "gender", width: "75", className: "textCapitalize" },
      { name: "Language", attr: "language", width: "100", className: "textCapitalize" },
      { name: "Role", attr: "role", width: "100", className: "textCapitalize" },
      { name: "Phone Number", attr: "primary_telephone_number", width: "150" },
      { name: "Email", attr: "primary_email", width: "200" }
    ],
    actions: [
      { name: 'View', attr: "View" },
    ],
    getRecord: (params: any) => this.notifiService.getUserSegementUsers({ rule_type: this.type, rules: this.usersegementRules, channels: ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'] }),
    buildData: (userProfileList: any) => {
      return userProfileList.map((userprofile: any) => {
        return {
          id: userprofile.id,
          name: userprofile.name,
          gender: userprofile.gender,
          date_of_birth: this.datePipe.transform(userprofile.date_of_birth, this.notifiService.date_format),
          language: userprofile.language,
          role: userprofile.role,
          primary_telephone_number: userprofile.primary_telephone_number,
          primary_email: userprofile.primary_email,
          link: {
            id: '/user-profile/' + userprofile.id,
          },
          action: {
            View: '/user-profile/' + userprofile.id,
          }
        };
      });
    }
  };

  @ViewChild('user_profile_grid') userProfileGrid: DataTableComponent | undefined;

  constructor(public notifiService: NotificationUiService, private alertController: AlertController,
    private datePipe: DatePipe, private router: Router, private modelcontroller: ModalController) { }

  ngOnInit() {
  }

  async openModal(element: any) {
    this.isOpen = true;
    this.campaignsDetail = element;
  }

  cancel() {
    this.modelcontroller.dismiss();
  }

}
