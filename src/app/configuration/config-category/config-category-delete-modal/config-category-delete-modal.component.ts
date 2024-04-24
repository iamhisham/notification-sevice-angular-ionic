import { Component, OnInit, EventEmitter, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { NotificationUiService } from '../../../services/notification-ui.service';


@Component({
  selector: 'app-config-category-delete-modal',
  templateUrl: './config-category-delete-modal.component.html',
  styleUrls: ['./config-category-delete-modal.component.scss'],
})
export class ConfigCategoryDeleteModalComponent implements OnInit {

  constructor(private modalController: ModalController,
    private notifiService: NotificationUiService) { }

  viewName: string = "";
  showCategoryDropdown: boolean = false;
  newCategory_id: string = "";

  @Input() category: any;
  @Input() categoryList: any;
  @Input() deleteEvent: any;

  ngOnInit() {
    this.viewName = "ACTION_DENIED";
    this.showCategoryDropdown = false;
  }

  moveTemplate() {
    if (!this.showCategoryDropdown) {
      this.showCategoryDropdown = true;
    } else {
      this.viewName = "MOVING_TEMPLATE";
      const data = { existingCategoryId: this.category.id, newCategoryId: this.newCategory_id };
      this.notifiService.remapCategory(data).subscribe({
        next: (data: any) => {
          setTimeout(() => {
            this.viewName = "MOVING_TEMPLATE_SUCCESS";
          }, 500);
        },
        error: async (err: any) => {
          this.notifiService.toster.error(err?.error.message || err.message || "Fail to Move Template");
          err = err.error?.error || err.error || err;
          if (err.CUSTOM_ERROR_CODE == 1002) {
            this.viewName = 'ACTION_DENIED';
            this.showCategoryDropdown = true;
          }
          else {
            await this.modalController.dismiss();
          }
        }
      });
    }
  }

  deleteTemplate() {
    this.viewName = "DELETING_TEMPLATE";
    this.notifiService.deleteTemplateByCategoryId(this.category.id).subscribe({
      next: (data: any) => {
        setTimeout(() => {
          this.viewName = "DELETE_TEMPLATE_SUCCESS";
        }, 500);
      },
      error: (err: any) => {
        this.notifiService.toster.error(err.message || "Fail to Delete Template");
        this.modalController.dismiss();
      }
    });
  }

  deleteCategory() {
    this.modalController.dismiss();
    this.deleteEvent(this.category.id);
  }

  closeModal() {
    this.modalController.dismiss();
  }
}

