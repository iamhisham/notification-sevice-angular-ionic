import { Component, OnInit, Input, ViewChild, TemplateRef } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ModalController } from '@ionic/angular';
import * as QuillNamespace from 'quill';
let Quill: any = QuillNamespace;
import ImageResize from "quill-image-resize-module";
import { QuillEditorImageSelectComponent } from '../quill-editor-image-select/quill-editor-image-select.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-template-page',
  templateUrl: './template-page.component.html',
  styleUrls: ['./template-page.component.scss'],
  animations: [
    trigger('myAnimationTrigger', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('0.3s ease-in'))
    ])
  ]
})
export class TemplatePageComponent implements OnInit {
  @ViewChild('popover') popover;
  @Input() receivedValue: string = '';
  @Input() preview_channel: any;
  @Input() needTemplateParser: boolean = false;
  @Input() content: any;
  @Input() dynamicTagDetails: any = null;
  @Input() systemTagDetails: any = null;
  @Input() isEmailReadOnly: boolean = false;
  @Input() isViewReason: boolean = false;
  @Input() isPreviewPopup: boolean = false;
  @Input() isFullScreenEditor: boolean = false;
  @Input() codeMirrorOptions: any = {};
  @Input() systemTagList: any = [];
  @Input() template: any = {};
  @Input() addSelectedTag: ((tag: string) => void) | any;
  @Input() showDynamicContentPopup: ((type: string) => void) | any;
  @Input() codeMirrorFormatCode: ((tag: any) => void) | any;
  @Input() attachment_details: any;
  @Input() attachment_list: any[] = [];
  @Input() attachment_preview: any;

  isOpen = false;
  @ViewChild('codeMirror') codeMirror: CodemirrorComponent | any;
  editorInstance: any;
  fileData: any = {};
  modules: any = {
    imageResize: {
      handleStyles: {
        backgroundColor: 'black',
        border: 'none',
        color: 'white'
      }
    },
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      // ['blockquote', 'code-block'],
      // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
      // [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
      ['link', 'image'/*, 'video'*/],                        // link and image, video
    ]
  };

  preview_isExpand: boolean = false;
  contentLength: any;
  notification_content: any[] = [];

  constructor(public notifiService: NotificationUiService, public modalCtrl: ModalController) {
  }

  ngOnInit() {
    var fontStyle = Quill.import('attributors/style/font');
    var alignStyle = Quill.import('attributors/style/align');
    this.notification_content = this.attachment_list;
    Quill.register(alignStyle, false);
    Quill.register(fontStyle, false);
    Quill.register('modules/imageResize', ImageResize);
    this.receivedValue;
    if (this.needTemplateParser && this.systemTagDetails == null) {
      this.systemTagDetails = {
        "first_name": 'John',
        "last_name": 'Doe',
        "name": 'John Doe',
        "email": 'john_doe@web-3.in',
        "phone_number": '+1-5744566345',
        "gender": 'MALE',
        "date_of_birth": '12-11-1990',
        "language": 'English'
      };
    }


  }

  getPreviewData(message: string = '') {
    var dynamicTagDetails = this.dynamicTagDetails || {}
    if (this.systemTagDetails) {
      dynamicTagDetails.system = this.systemTagDetails;
    }
    if (this.needTemplateParser && Object.keys(dynamicTagDetails).length > 0) {
      return Handlebars.compile(message)(dynamicTagDetails);
    }
    return message;
  }


  getPreviewImageData(key: string, parentKey: string = '') {
    var imageOrIconContent = this.preview_channel == 'IN_APP_MESSAGE' ? this.content[parentKey][key] : this.content[key];
    if (imageOrIconContent) {
      return (imageOrIconContent.source_type === 'FILE' && imageOrIconContent.fileName ?
        (imageOrIconContent.base64Content || (this.notifiService.image_prefix_url + imageOrIconContent.path)) :
        imageOrIconContent.url) || '';
    }
    return '';
  }

  cancel() {
    return this.modalCtrl.dismiss();
  }

  getImageData(quill: any) {
    this.editorInstance = quill;
    let toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', this.imageEditor.bind(this, quill));
    quill.root.addEventListener('paste', this.handlePaste.bind(this, quill));
  }
  async imageEditor(quill: any) {
    const range = quill.getSelection();
    let data: any = this.editorInstance;
    this.fileData = await this.openTemp();
    if (!this.editorInstance) {
      return;
    }
    if (this.fileData?.url) {
      data.insertEmbed(range.index, 'image', this.fileData.url, Quill.sources.USER);
    }
    if (this.fileData?.base64Content) {
      let fileData: any = {};
      fileData = await this.getEmailFileUpload(this.fileData);
      data.insertEmbed(range.index, 'image', fileData.url, Quill.sources.USER);
    }
  }

  async handlePaste(quill: any, event: ClipboardEvent) {
    const files = event.clipboardData?.files || [];
    var file = files[0] || {};
    if ((file?.type || '').indexOf('image') !== -1) {
      event.preventDefault();
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (e: any) => {
        this.fileData = {};
        this.fileData.fileName = file.name;
        this.fileData.filetype = file.type;
        this.fileData.base64Content = e.target.result;
        const range = quill.getSelection();
        let fileData: any = {};
        fileData = await this.getEmailFileUpload(this.fileData);
        quill.insertEmbed(range.index, 'image', fileData.url, Quill.sources.USER);
      }
    }
  }

  async getEmailFileUpload(fileData: any) {
    fileData.base64Content = fileData.base64Content.toString().replace(`data:${fileData.filetype};base64,`, "");
    this.notifiService.showLoader();
    fileData = await this.notifiService.getEmailFileUpload(fileData).toPromise();
    this.notifiService.hideLoader();
    return fileData;
  }

  async openTemp() {
    var modal = await this.modalCtrl.create({
      component: QuillEditorImageSelectComponent,
      cssClass: 'quillImageModalSize',
      componentProps: {
        // modal: modal
      },
      backdropDismiss: false
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    return data;
  }
  presentPopover(e: Event) {
    this.popover.event = e;
    this.isOpen = true;
  }

}
