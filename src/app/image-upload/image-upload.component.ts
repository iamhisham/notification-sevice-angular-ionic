import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { fileURLToPath } from 'url';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { NotificationUiService } from '../services/notification-ui.service';
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  animations: [
    trigger('myAnimationTrigger', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('0.3s ease-in'))
    ])
  ]
})
export class ImageUploadComponent implements OnInit {
  @Input() public title: any;
  @Input() public details: any;
  @Input() public preview: any;
  constructor(private notifiService: NotificationUiService) { }
  ngOnInit() {
    this.details.source_type = this.details.source_type || 'FILE';
  }

  // image to base64 conversion
  getBase64URL(event: any) {
    try {
      var file = event.target.files[0];
      if (file) {
        this.notifiService.handleSupportedFileType(file, this.notifiService.image_extensions);
        this.notifiService.handleFileSize(file, this.notifiService.maxAllowedSize);
        var reader = new FileReader();
        reader.readAsDataURL(file);
        this.details.fileName = file.name;
        reader.onload = (e: any) => {
          this.details.base64Content = e.target.result;
        }
        event.target.value = "";
      }
    } catch (err: any) {
      event.target.value = "";
      this.notifiService.toster.error(err || err.message);
      this.notifiService.hideLoader();
    }

  };

  deleteUploadedFile() {
    delete this.details.fileName;
    delete this.details.base64Content;
  }

}
