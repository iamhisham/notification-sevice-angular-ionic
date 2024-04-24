/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidationErrors, ValidatorFn, AbstractControl, } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { NotificationUiService } from 'src/app/services/notification-ui.service';

@Component({
  selector: 'app-config-category-create-update',
  templateUrl: './config-category-create-update.html',
  styleUrls: ['./config-category-create-update.scss'],
})
export class ConfigCategoryCreateUpdateComponent implements OnInit {

  form!: FormGroup;
  catagoryId: any;
  category: any = {};
  isEditView: boolean = false;
  rateLimit_type: string = '';
  rateLimit_value: any = null;
  isCloneView: boolean = false;

  constructor(private alertController: AlertController, private router: Router,
    public notifiService: NotificationUiService, private toastController: ToastController,
    public platform: Platform, private actRouter: ActivatedRoute, public loadingCtrl: LoadingController) { }

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

  resetAll() {
    this.catagoryId = null;
    this.category = { priority: "LOW" };
    this.isEditView = false;
    this.rateLimit_type = '';
    this.rateLimit_value = null;
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.resetAll();
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.catagoryId = JSON.parse(param['get']('category_id'));
      if (!this.catagoryId) {
        this.catagoryId = JSON.parse(param['get']('clone_category_id'));
        if (this.catagoryId) this.isCloneView = true;
      }
      if (this.catagoryId != null) {
        if (!this.isCloneView) this.isEditView = true;
        this.getCategoryById(this.catagoryId);
      };
    });

    this.validateForm();
  }

  getCategoryById(catagoryId: any) {
    this.notifiService.showLoader();
    this.notifiService.getCategoryById(catagoryId).subscribe({
      next: (category: any) => {
        this.notifiService.hideLoader();
        if (this.isCloneView) this.notifiService.cleanClonedObject(category, 'category');
        this.category = category;
        const rateLimitSplit = (this.category.rateLimit || '').split(' PER ');
        if (rateLimitSplit.length == 2) {
          this.rateLimit_value = rateLimitSplit[0];
          this.rateLimit_type = rateLimitSplit[1];
        }
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  validateForm() {
    this.form = new FormGroup({
      name: new FormControl(this.category.name, [
        Validators.required,
        this.noWhitespaceValidator1,
      ]),
      rateLimit: new FormControl(this.category.rateLimit_value, {
        validators: [Validators.min(1),]
      }),
      priority: new FormControl(this.category.priority, {
        validators: [Validators.required]
      }),
      timetoliveLimit: new FormControl(this.category.ttl, {
        validators: [Validators.min(1), Validators.max(28)]
      }),

    });
  }
  noWhitespaceValidator1(control: FormControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }
  numericOnly(event: any): boolean {
    let pattern = /^([0-9])$/;
    let result = pattern.test(event.key);
    return result;
  }

  onCategoryChange() {
    if (this.category.priority == 'MANDATORY') {
      this.rateLimit_type = '';
      this.rateLimit_value = null;
    }
  }

  save() {
    if (!this.form.valid) return;
    if (this.rateLimit_value == null && this.rateLimit_type != '') {
      this.notifiService.toster.error('Please enter rate limit');
    } else {
      if (this.rateLimit_type && this.rateLimit_value) this.category.rateLimit = this.rateLimit_value + ' PER ' + this.rateLimit_type;
      else this.category.rateLimit = null;
      this.notifiService.showLoader();
      if (this.isEditView) {
        this.notifiService.updateCategoryById(this.catagoryId, this.category).subscribe({
          next: (e: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success('Category Updated Successfully!');
            this.router.navigate(['/configuration/category']);
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'Category Update Failed');
          }
        });
      } else {
        this.notifiService.createCategoty(this.category).subscribe({
          next: (e: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success('Category Created Successfully!');
            this.router.navigate(['/configuration/category']);
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'Category Create Failed');
          }
        });
      }
    }
  }

  //onCancel popup
  async onCancel() {
    this.notifiService.showCancelConfirmation(['/configuration/category']);
  }


}


