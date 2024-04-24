import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-quill-editor-image-select',
  templateUrl: './quill-editor-image-select.component.html',
  styleUrls: ['./quill-editor-image-select.component.scss'],
})
export class QuillEditorImageSelectComponent implements OnInit {

  fileName: any = '';
  details: any = {};
  url: any = '';
  @Input() modal;
  uploadType: any = { name: "URL", value: "URL" };

  constructor(public notifiService: NotificationUiService) { }

  ngOnInit() { }

  onSave() {
    this.details.url = this.url;
    this.modal.dismiss(this.details);
  }

  onCancel() {
    this.modal.dismiss();
  }

  getBase64URL(event: any) {
    try {
      var file = event.target.files[0];
      if (file) {
        this.notifiService.handleSupportedFileType(file, this.notifiService.image_extensions);
        this.notifiService.handleFileSize(file, this.notifiService.maxAllowedSize);
        this.fileName = event.target.value;
        var reader = new FileReader();
        reader.readAsDataURL(file);
        this.details.fileName = file.name;
        this.details.filetype = file.type;
        reader.onload = (e: any) => {
          this.details.base64Content = e.target.result;
        }
        event.target.value = "";
      }
    } catch (err: any) {
      this.notifiService.toster.error(err);
    }
  };

  deleteImage() {
    this.fileName = '';
    delete this.details.fileName;
    delete this.details.base64Content;
  }
}

