import { DatePipe, Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertController, IonRouterOutlet, ModalController } from '@ionic/angular';
import { DataTableComponent } from 'src/app/data-table/data-table.component';
import { NotificationUiService } from 'src/app/services/notification-ui.service';

@Component({
  selector: 'app-view-attribute',
  templateUrl: './view-attribute.component.html',
  styleUrls: ['./view-attribute.component.scss'],
})
export class ViewAttributeComponent implements OnInit {
  myForm!: FormGroup;
  attributeTableDetails: any = {
    name: "attribute",
    pk: "id",
    search: "",
    needServerSidePagination: false,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "CLICK", clickFunction: (el: any) => this.setOpen(el) },
      { name: "Name", attr: "name", width: "175" },
      { name: "Type", attr: "type", width: "175", className: "textCapitalize" },
      { name: "Description", attr: "description", width: "135" },
      { name: "Created Time", attr: "createdAt", width: "175" },
      { name: "Updated Time", attr: "updatedAt", width: "175" },
    ],
    actions: [
      { name: "Edit", clickFunction: (el: any) => this.setOpen(el) },
      { name: "Delete", clickFunction: (el: any) => this.confirmDelete(el, 'deleted') }
    ],
    getRecord: (params: any) => this.notifiService.getAllAttribute(),
    buildData: (attribute: any) => {
      return attribute.map((attribute: any) => {
        return {
          id: attribute.id,
          name: attribute.name,
          type: attribute.type,
          description: attribute.description,
          createdAt: this.datePipe.transform(attribute.createdAt, this.notifiService.date_time_format),
          updatedAt: this.datePipe.transform(attribute.updatedAt, this.notifiService.date_time_format),
        };
      });
    }
  };
  //
  // form!: FormGroup;
  isModalOpen = false;
  attributeEditId: any;
  isInitTriggered: boolean = false;
  attribute: any = {};
  isEditView: boolean = false;
  @ViewChild('attribute_grid') attributeGrid: DataTableComponent | undefined;
  constructor(public notifiService: NotificationUiService, private datePipe: DatePipe,
    private modalController: ModalController, private alertController: AlertController) { }

  ngOnInit() {
    this.init();
  }

  ionViewWillEnter() {
    this.init();
  }

  init() {
    this.validateForm();
  }

  onWillDismiss(event: Event) {
    this.isModalOpen = false;
    this.isEditView = false;
  }


  setOpen(element?: any) {
    if (element) {
      this.attribute = {
        id: element.id,
        name: element.name,
        type: element.type,
        description: element.description
      };
      this.isEditView = true;
    } else {
      this.isEditView = false;
      this.attribute = {};
    }
    this.isModalOpen = true;

    // backbtn func disable due to pop up close
    history.pushState(null, location.href);
    window.onpopstate = (event) => {
      // this.modalController.dismiss();
      this.isModalOpen = false;
      // history.go(1);
      // event.preventDefault();
    };
  }

  validateForm() {
    this.myForm = new FormGroup({
      name: new FormControl(this.attribute.name, [Validators.required,
      this.noWhitespaceValidator1,
      ]),
      type: new FormControl(this.attribute.type, [Validators.required,]),
    });
  }
  noWhitespaceValidator1(control: FormControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }
  save() {
    try {
      if (!this.attribute.name || this.attribute.name.split(' ').join('').length == 0) throw "Please enter Name"
      // edit
      if (this.isEditView) {
        this.notifiService.updateAttributeById(this.attribute.id, this.attribute).subscribe({
          next: async (attribute: any) => {
            this.attribute = attribute;
            this.modalController.dismiss('confirm');
            this.notifiService.toster.success('User Attribute updated successfully')
            await this.attributeGrid?.init();
            this.isEditView = false;
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'Failed');
          }
        })
      } //create
      else {
        this.notifiService.createAttribute(this.attribute).subscribe({
          next: async (attribute: any) => {
            this.notifiService.toster.success('User Attribute created successfully')
            this.modalController.dismiss('confirm');
            await this.attributeGrid?.init();
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'Failed');
          }
        });
      }
    }
    catch (e) {
      this.notifiService.toster.error(e);
    }
  }


  async confirmDelete(attribute: any, status?: any) {
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
            this.deleteAtribute(attribute.id);
          }
        },
      ],
    });
    await alert.present();
  }

  deleteAtribute(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteAttributeById(id).subscribe({
      next: async (data: any) => {
        this.notifiService.toster.success('User attribute deleted successfully!');
        await this.attributeGrid?.init();
        this.notifiService.hideLoader();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'User attribute Deleted Failed');
      }
    });
  }
  ionViewWillLeave() {
    this.isInitTriggered = false;
    this.notifiService.closeAllAlertCtrl();
  }
}
