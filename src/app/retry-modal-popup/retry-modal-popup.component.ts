import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-retry-modal-popup',
  templateUrl: './retry-modal-popup.component.html',
  styleUrls: ['./retry-modal-popup.component.scss'],
})
export class RetryModalPopupComponent implements OnInit {
 
  @Input() response: any;
  @Input() isSuccess: boolean = false;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}

  modalClose() {
    this.modalCtrl.dismiss();
  }

}
