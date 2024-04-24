import { Component, OnInit, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationUiService } from 'src/app/services/notification-ui.service';

@Component({
  selector: 'app-temp-create-popup-modal',
  templateUrl: './temp-create-popup-modal.component.html',
  styleUrls: ['./temp-create-popup-modal.component.scss'],
})
export class TempCreatePopupModalComponent implements OnInit {

  form!: FormGroup;
  @Input() template: any;
  @Input() categoryList: any;

  matSelect: any = {
    dropdownFilterSearch: ''
  }

  constructor(private modalController: ModalController,
    private alertController: AlertController,
    private router: Router, public notifiService: NotificationUiService) { }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(this.template.name,
        [Validators.required, this.noWhitespaceValidator1,]
      ),
      categoryId: new FormControl(this.template.categoryId, {
        validators: [Validators.required]
      })
    })
  }

  ionViewWillLeave() {
    this.notifiService.isTempPopup = false;
  }

  noWhitespaceValidator1(control: FormControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  async confirmCancel() {
    this.notifiService.isTempPopup = false;
  }

  proceed() {
    if (!this.form.valid) return;
    this.notifiService.isTempPopup = false;
  }

}
