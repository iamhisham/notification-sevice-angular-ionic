import * as JSZip from 'jszip';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute, Params, Router, NavigationStart } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
import { NotificationUiService } from 'src/app/services/notification-ui.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicTagsModelComponent } from '../dynamic-tags-model/dynamic-tags-model.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TemplatePageComponent } from 'src/app/template-page/template-page.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import * as Beautify from 'js-beautify';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { type } from 'os';

@Component({
  selector: 'app-temp-create',
  templateUrl: './temp-create.html',
  styleUrls: ['./temp-create.scss'],
  animations: [
    trigger('myAnimationTrigger', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('0.3s ease-in'))
    ])
  ]
})
export class TempCreate implements OnInit {
  enableCheckbox: any = {
    sameImageAsPortrait: false,
    isPrimaryContent: false,
    isSecondaryContent: false,
  }
  addButton: boolean = false;
  channelList: any;

  isModelOpen: boolean = false;
  modal: any = null;

  isEditView: boolean = false;
  isCloneView: boolean = false;
  isCategoryLoaded: boolean = false;
  isTempalteLoaded: boolean = false;
  template_id: string = '';
  template: any = {};
  categoryList: any = [];
  form!: FormGroup;

  @ViewChild('codeMirrorEditor') codeMirrorComponent: CodemirrorComponent | any;
  selectedChannel: string = "NEW";
  dynamicTag: any = { type: "", cursor: {} };
  systemTagList = ["first_name", "last_name", "name", "email", "phone_number", "gender", "date_of_birth", "language"];
  // emailAttachmentFile: any = {};

  quillData = {
    'emoji-toolbar': true,
    'emoji-textarea': true,
    'emoji-shortname': true,
    'syntax': true,
    toolbar: {
      container: [
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
        ['emoji'],
      ],
    }
  };

  codeMirrorOptions: any = {
    lineNumbers: true,
    theme: 'material',// Set the theme default
    mode: 'htmlmixed',// Set the mode to 'htmlmixed' to handle HTML content with embedded JavaScript or CSS
    autoCloseTags: true,// Automatically close HTML tags
    matchTags: { bothTags: true },// Highlight matching HTML tags
    autoCloseBrackets: true,// Automatically close brackets (parentheses, square brackets, etc.)
    matchBrackets: true, // Highlight matching brackets
    lint: true, // Enable HTML linting
    foldGutter: true, // Enable code folding
    lineWrapping: true, // Enable line wrapping
    autoRefresh: true,
    extraKeys: { 'Ctrl-F': 'findPersistent', 'Cmd-F': 'findPersistent' }
  };

  constructor(private modalController: ModalController, public notifiService: NotificationUiService,
    private router: Router, private actRouter: ActivatedRoute,
    private alertController: AlertController, public platform: Platform, private http: HttpClient) {
    this.channelList = [
      {
        title: 'Email',
        name: 'EMAIL',
        iconName: 'mail-outline',
        image: '../../../../assets/icons/' + this.notifiService.themeName + '/email_template.svg'
      },
      {
        title: 'Web Push',
        name: 'WEB_PUSH',
        iconName: 'desktop-outline',
        image: '../../../../assets/icons/' + this.notifiService.themeName + '/web_push_template.svg'
      },
      {
        title: 'Mobile Push',
        name: 'MOBILE_PUSH',
        iconName: 'phone-portrait-outline',
        image: '../../../../assets/icons/' + this.notifiService.themeName + '/mobile_push_template.svg'
      },
      {
        title: 'SMS',
        name: 'SMS',
        iconName: 'chatbox-ellipses-outline',
        image: '../../../../assets/icons/' + this.notifiService.themeName + '/sms_push_template.svg'
      },
      {
        title: 'In-App',
        name: 'IN_APP_MESSAGE',
        iconName: 'apps-outline',
        image: '../../../../assets/icons/' + this.notifiService.themeName + '/web_push_template.svg'
      }
    ];
    router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        if (this.isModelOpen) this.modal.dismiss();
      }
    });
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
    this.notifiService.isTempPopup = false;
  }


  resetAll() {
    this.isEditView = false;
    this.isCategoryLoaded = false;
    this.isTempalteLoaded = false;
    this.template_id = '';
    this.template = {};
    this.categoryList = [];
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.resetAll();
    this.notifiService.showLoader();
    this.validateAndLoadDefaultData();
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.template_id = param['get']('template_id');
      if (!this.template_id) {
        this.template_id = param['get']('clone_template_id');
        if (this.template_id) this.isCloneView = true;
      }
      if (this.template_id) {
        if (!this.isCloneView) this.isEditView = true;
        this.getTemplateById();
      } else this.isTempalteLoaded = true;
    });
    this.getAllCategory();
    this.validateForm();
  }


  validateForm() {
    this.form = new FormGroup({
      subject: new FormControl(this.template.emailContent.subject, {
        validators: [Validators.required]
      }),
      message: new FormControl(this.template.emailContent.message, {
        validators: [Validators.required]
      }),
      title: new FormControl(this.template.webPushContent.title, {
        validators: [Validators.required]
      }),
      msg: new FormControl(this.template.webPushContent.message, {
        validators: [Validators.required]
      }),
      mobTitle: new FormControl(this.template.pushContent.title, {
        validators: [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]
      }),
      mobMsg: new FormControl(this.template.pushContent.message, {
        validators: [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]
      }),
      smsContent: new FormControl(this.template.smsContent.message, {
        validators: [Validators.required]
      }),
      htmlContent: new FormControl(this.template.inAppContent.htmlContent, {
        validators: [Validators.required]
      }),
      cardBackgroundcolor: new FormControl(this.template.inAppContent.card.backgroundColorHex, {
        validators: [Validators.required]
      }),
      cardTitleColor: new FormControl(this.template.inAppContent.card.title.colorHex, {
        validators: [Validators.required]
      }),
      cardTitle: new FormControl(this.template.inAppContent.card.title.text, {
        validators: [Validators.required]
      }),
      cardButtontext: new FormControl(this.template.inAppContent.card.primaryActionButton.text.text, {
        validators: [Validators.required]
      }),
      cardButtonBackgroundColor: new FormControl(this.template.inAppContent.card.primaryActionButton.buttonColorHex, {
        validators: [Validators.required]
      }),
      cardButtontextColor: new FormControl(this.template.inAppContent.card.primaryActionButton.text.colorHex, {
        validators: [Validators.required]
      }),
      modalBackground: new FormControl(this.template.inAppContent.modal.backgroundColorHex, {
        validators: [Validators.required]
      }),
      modalTextcolor: new FormControl(this.template.inAppContent.modal.title.colorHex, {
        validators: [Validators.required]
      }),
      modalTitle: new FormControl(this.template.inAppContent.modal.title.text, {
        validators: [Validators.required]
      }),
      bannerBackground: new FormControl(this.template.inAppContent.banner.backgroundColorHex, {
        validators: [Validators.required]
      }),
      bannerTextcolor: new FormControl(this.template.inAppContent.banner.title.colorHex, {
        validators: [Validators.required]
      }),
      bannerTitle: new FormControl(this.template.inAppContent.banner.title.text, {
        validators: [Validators.required]
      }),
    })
  }

  validateAndLoadDefaultData() {
    this.template.channels = this.template.channels || [];
    this.template.emailContent = this.template.emailContent || {};
    this.template.emailContent.editor_type = this.template.emailContent.editor_type || 'EMAIL_EDITOR';
    this.template.smsContent = this.template.smsContent || {};
    this.template.pushContent = this.template.pushContent || {};
    this.template.webPushContent = this.template.webPushContent || {};
    this.template.inAppContent = this.template.inAppContent || {};
    this.template.dynamic_tags = this.template.dynamic_tags || [];
    this.template.pushContent.image = this.template.pushContent.image || {};
    this.template.webPushContent.image = this.template.webPushContent.image || {};
    this.template.webPushContent.icon = this.template.webPushContent.icon || {};

    this.template.inAppContent.type = this.template.inAppContent.type || "CARD";
    this.template.inAppContent.card = this.template.inAppContent.card || {};
    this.template.inAppContent.modal = this.template.inAppContent.modal || {};
    this.template.inAppContent.imageOnly = this.template.inAppContent.imageOnly || {};
    this.template.inAppContent.banner = this.template.inAppContent.banner || {};

    this.template.inAppContent.card.title = this.template.inAppContent.card.title || {};
    this.template.inAppContent.card.body = this.template.inAppContent.card.body || {};
    this.template.inAppContent.card.imageFlag = this.template.inAppContent.card.imageFlag || {};
    this.template.inAppContent.card.portraitImageUrl = this.template.inAppContent.card.portraitImageUrl || {};
    this.template.inAppContent.card.landscapeImageUrl = this.template.inAppContent.card.landscapeImageUrl || {};
    this.template.inAppContent.card.primaryActionButton = this.template.inAppContent.card.primaryActionButton || {};
    this.template.inAppContent.card.primaryActionButton.text = this.template.inAppContent.card.primaryActionButton.text || {};
    this.template.inAppContent.card.primaryAction = this.template.inAppContent.card.primaryAction || {};
    this.template.inAppContent.card.SecondaryAction = this.template.inAppContent.card.SecondaryAction || {};
    this.template.inAppContent.card.SecondaryActionButton = this.template.inAppContent.card.SecondaryActionButton || {};
    this.template.inAppContent.card.SecondaryActionButton.text = this.template.inAppContent.card.SecondaryActionButton.text || {};

    this.template.inAppContent.modal.title = this.template.inAppContent.modal.title || {};
    this.template.inAppContent.modal.body = this.template.inAppContent.modal.body || {};
    this.template.inAppContent.modal.imageUrl = this.template.inAppContent.modal.imageUrl || {};
    this.template.inAppContent.modal.actionButton = this.template.inAppContent.modal.actionButton || {};
    this.template.inAppContent.modal.actionButton.text = this.template.inAppContent.modal.actionButton.text || {};
    this.template.inAppContent.modal.action = this.template.inAppContent.modal.action || {};

    this.template.inAppContent.imageOnly.imageUrl = this.template.inAppContent.imageOnly.imageUrl || {};
    this.template.inAppContent.imageOnly.action = this.template.inAppContent.imageOnly.action || {};

    this.template.inAppContent.banner.title = this.template.inAppContent.banner.title || {};
    this.template.inAppContent.banner.body = this.template.inAppContent.banner.body || {};
    this.template.inAppContent.banner.imageUrl = this.template.inAppContent.banner.imageUrl || {};
    this.template.inAppContent.banner.action = this.template.inAppContent.banner.action || {};

    this.template.attachments = this.template.attachments || [];

  }

  getAllCategory() {
    this.notifiService.getAllCategory().subscribe({
      next: (categoryList: any) => {
        this.isCategoryLoaded = true;
        if (this.isTempalteLoaded) this.notifiService.hideLoader();
        this.categoryList = categoryList.data;
        if (!this.isEditView && !this.isCloneView) this.opentempalteBaseDetailsModel();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  getTemplateById() {
    this.notifiService.getTemplateById(this.template_id).subscribe({
      next: (template: any) => {
        this.isTempalteLoaded = true;
        if (this.isCategoryLoaded) this.notifiService.hideLoader();
        if (this.isCloneView) this.notifiService.cleanClonedObject(template, 'template');
        this.template = template;
        this.validateAndLoadDefaultData();
        this.reArrangeChannel();
        this.selectedChannel = this.template.channels[0] || 'NEW';
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  async opentempalteBaseDetailsModel() {
    // var modal = await this.modalController.create({
    //   component: TempCreatePopupModalComponent,
    //   cssClass: 'modalSize',
    //   componentProps: {
    //     template: this.template,
    //     categoryList: this.categoryList
    //   },
    //   backdropDismiss: false
    // });
    // modal.onDidDismiss().then((modelData) => {

    // });
    // await modal.present();
    setTimeout(() => {
      this.notifiService.isTempPopup = true;
    }, 500);

  }

  async dynamicTagModel() {
    var modal = await this.modalController.create({
      component: DynamicTagsModelComponent,
      cssClass: 'dynamic-tag-model',
      componentProps: {
        template: this.template,
        isTemplateScreen: true
      },
    });
    modal.onDidDismiss().then((modelData) => {
    });
    await modal.present();
  }

  reArrangeChannel() {
    const channelOrder = this.channelList.map((channel: any) => channel.name);
    this.template.channels = this.template.channels.sort((a: any, b: any) => {
      if (channelOrder.indexOf(a) < channelOrder.indexOf(b)) return -1;
      else return 1;
    });
  }

  getSelectedChannelList() {
    return this.channelList.filter(channel => this.template.channels.indexOf(channel.name) != -1);
  }

  addChannel(channelName: any) {
    var selectedInded = this.template.channels.indexOf(channelName);
    if (selectedInded == -1) {
      this.template.channels.push(channelName);
      this.reArrangeChannel();
      this.selectedChannel = channelName;
      // this.selectedChannel = this.template.channels[0] || 'NEW';
    } else {
      this.selectedChannel = channelName;
    }
  }

  removeChannel(channelName: any) {
    this.showCancelConfirmation(channelName);
  }

  showAddChannelView() {
    this.selectedChannel = "NEW";
  }

  switchChannel(channel: string) {
    this.selectedChannel = channel;
  }

  save() {
    var template = JSON.parse(JSON.stringify(this.template));
    if (!this.validateTemplate(template)) return;
    this.notifiService.showLoader();
    if (this.isEditView) {
      if (this.isCloneView) {

      }
      this.notifiService.updateTemplateById(this.template_id, template).subscribe({
        next: async (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success("Template Updated Successfully!");
          this.router.navigate(['/configuration/template']);
        },
        error: async (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || "Template Update Failed");
          if (err.CUSTOM_ERROR_CODE == 1003) {
            await this.opentempalteBaseDetailsModel();
          }
        }
      });
    } else {
      this.notifiService.createTemplate(template).subscribe({
        next: async (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success('Template Created Successfully!');
          this.router.navigate(['/configuration/template']);
        },
        error: async (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || 'Template Create Failed');
          if (err.CUSTOM_ERROR_CODE == 1003) {
            await this.opentempalteBaseDetailsModel();
          }
        }
      });
    }
    this.notifiService.hideLoader()
  }

  validateTemplate(template: any) {
    try {
      if (!template.name || !template.name.trim()) {
        this.opentempalteBaseDetailsModel();
        throw "Please Enter template Name";
      } else if (!template.categoryId) {
        this.opentempalteBaseDetailsModel();
        throw "Please Select Category";
      }
      if (template.channels.length == 0) {
        this.selectedChannel = "NEW";
        throw "Please Select Channel";
      }
      template.channels.forEach((channel: string) => {
        switch (channel) {
          case 'MOBILE_PUSH':
            if (!template.pushContent.title) {
              this.selectedChannel = channel;
              throw "Please Enter Title";
            } else if (!template.pushContent.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            } else if (this.payloadSize(template.pushContent) > 4078) {
              throw new Error('size exceeds the limit!');
            }
            break;
          case 'WEB_PUSH':
            if (!template.webPushContent.title) {
              this.selectedChannel = channel;
              throw "Please Enter Title";
            } else if (!template.webPushContent.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            } else if (this.payloadSize(template.webPushContent) > 4078) {
              throw new Error('size exceeds the limit!');
            }
            break;
          case 'EMAIL':
            if (!template.emailContent.subject) {
              this.selectedChannel = channel;
              throw "Please Enter Subject";
            } else if (template.emailContent.editor_type == "HTML_EDITOR" && !template.emailContent.html_message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            } else if (template.emailContent.editor_type != "HTML_EDITOR" && !template.emailContent.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            }
            if (template.emailContent.editor_type == "HTML_EDITOR") delete template.emailContent.message;
            else delete template.emailContent.html_message;
            break;
          case 'SMS':
            if (!template.smsContent.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            }
            break;
          case 'IN_APP_MESSAGE':
            if (template.inAppContent.type === 'CARD') {
              if (!template.inAppContent.card.backgroundColorHex) throw "Please Enter Background color";
              if (!template.inAppContent.card.title.colorHex) throw "Please Enter Text color";
              if (!template.inAppContent.card.title.text) throw "Please Enter Title";
              if (!template.inAppContent.card.primaryActionButton.text.text) throw "Please Enter Button Title";
              if (!template.inAppContent.card.primaryActionButton.buttonColorHex) throw "Please Enter Button Text Color";
              if (!template.inAppContent.card.primaryActionButton.text.colorHex) throw "Please Enter Button Background Color";
              if (!template.inAppContent.card.portraitImageUrl.base64Content) throw "Please Upload Image";
            } else if (template.inAppContent.type === 'MODAL') {
              if (!template.inAppContent.modal.backgroundColorHex) throw "Please Enter Background color";
              if (!template.inAppContent.modal.title.colorHex) throw "Please Enter Text color";
              if (!template.inAppContent.modal.title.text) throw "Please Enter Title";
            } else if (template.inAppContent.type === 'IMAGE_ONLY') {
              if (!template.inAppContent.imageOnly.imageUrl.base64Content) throw "Please Upload Image";
            } else if (template.inAppContent.type === 'TOP_BANNER') {
              if (!template.inAppContent.banner.backgroundColorHex) throw "Please Enter Background color";
              if (!template.inAppContent.banner.title.colorHex) throw "Please Enter Text color";
              if (!template.inAppContent.banner.title.text) throw "Please Enter Title";
            }
            break;
          default: throw "Invalid channel";
        }
      });
      return true;
    } catch (err) {
      this.notifiService.toster.error(err);
      return false;
    }
  }

  async confirmCancel() {
    this.isModelOpen = true;
    this.modal = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made may not be saved.',
      cssClass: 'custom-alert-style',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.modalController.dismiss();
            this.router.navigate(['/configuration/template']);
          }
        },
      ],
    });
    this.modal.onDidDismiss().then(() => {
      this.isModelOpen = false;
    });
    await this.modal.present();
  }

  // mobile view right content
  isModalOpen = false;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  _addSelectedTag(obj: any, key: string, value: string) {
    var data = obj[key] || "";
    if (this.dynamicTag.cursor.hasOwnProperty("start")) {
      obj[key] = data.slice(0, this.dynamicTag.cursor.start) + "{{ " + value + " }}" + data.slice(this.dynamicTag.cursor.end);
    } else {
      obj[key] = data + "{{ " + value + " }}";
    }
    this.dynamicTag.cursor = {};
    return true;
  }

  addSelectedTag(tag: string) {
    switch (this.dynamicTag.type) {
      case "EMAIL_SUBJECT": return this._addSelectedTag(this.template.emailContent, 'subject', tag);
      case "EMAIL_MESSAGE": return this._addSelectedTag(this.template.emailContent, 'message', tag);
      case "WEBPUSH_TITLE": return this._addSelectedTag(this.template.webPushContent, 'title', tag);
      case "WEB_PUSH_MESSAGE": return this._addSelectedTag(this.template.webPushContent, 'message', tag);
      case "MOBILEPUSH_TITLE": return this._addSelectedTag(this.template.pushContent, 'title', tag);
      case "MOBILEPUSH_MESSAGE": return this._addSelectedTag(this.template.pushContent, 'message', tag);
      case "SMS_CONTENT": return this._addSelectedTag(this.template.smsContent, 'message', tag);
      case "EMAIL_HTMLEDITOR": return this.insertDynamicTagforHtmlEditor(`{{${tag}}}`);
      default: return false;
    }
  }

  cursorIndexIdentifier(event: any, type: string) {
    this.dynamicTag.cursor = {
      type,
      start: event.target.selectionStart,
      end: event.target.selectionEnd
    };
  }

  showDynamicContentPopup(type: string, codeMirror?: any) {
    if (this.dynamicTag.cursor.type != type) {
      this.dynamicTag.cursor = {};
    }
    this.dynamicTag.type = type;
    if (codeMirror) {
      this.codeMirrorComponent = codeMirror;
    }
  }

  updateColor(event: any) {
    console.log(event); // this is your selected color
  }
  checkboxEnable(checkboxtype: any) {
    this.enableCheckbox[checkboxtype] = !this.enableCheckbox[checkboxtype];
  }
  buttonAdding() {
    this.addButton = true;
  }

  async modalPresent(content: any, channel: any) {
    try {
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: channel,
          content: content,
          codeMirrorOptions: this.codeMirrorOptions,
          isPreviewPopup: true,
          isFullScreenEditor: true,
          systemTagList: this.systemTagList,
          template: this.template,
          addSelectedTag: this.addSelectedTag.bind(this),
          showDynamicContentPopup: this.showDynamicContentPopup.bind(this),
          codeMirrorFormatCode: this.codeMirrorFormatCode.bind(this)
        },
        backdropDismiss: false
      });
      await modal.present();
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }
  async showCancelConfirmation(channelName: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'You want to Delete this Channel.',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Delete',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => {
            var selectedInded = this.template.channels.indexOf(channelName);
            if (selectedInded != -1) {
              this.template.channels.splice(selectedInded, 1);
            }
            if (this.selectedChannel == channelName) {
              this.selectedChannel = this.template.channels[0] || 'NEW';
            }
          }
        },
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
      ],
    });
    await alert.present();
  }

  async getHtmlZipFile(event: any, fileType: string) {
    const selectedFile = event.target.files[0];
    await this.notifiService.showLoader();
    const reader = new FileReader();
    if (selectedFile && fileType) {
      try {
        switch (fileType) {
          case "ZIPFILE": {
            try {
              if (selectedFile.type == "application/zip" || selectedFile.type == "application/x-zip-compressed") {
                reader.readAsArrayBuffer(selectedFile);
                reader.onload = async (e: any) => {
                  var htmlContent = "";
                  const base64ImageMap: any = {};
                  const arrayBuffer = e.target.result as ArrayBuffer;
                  const zip = new JSZip();
                  const zipFileData: any = await zip.loadAsync(arrayBuffer).catch(err => {
                    this.notifiService.hideLoader();
                    this.notifiService.toster.error("The Upload Zip File is in invalid format");
                  });
                  try {
                    Object.entries(zipFileData.files).forEach(([relativePath, zipEntry]: any) => {
                      if ((['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(relativePath.split('.').pop() || ''))) {
                        if (zipEntry._data.uncompressedSize > 2 * 1024 * 1024) {
                          event.target.value = "";
                          throw `The size of each image within the uploaded zip file should not exceed 2MB`;
                        }
                      }
                    });
                    await Promise.all(Object.entries(zipFileData.files).map(async ([relativePath, zipEntry]: any) => {
                      if (!zipEntry.dir) {
                        const extension = relativePath.split('.').pop();
                        if (extension === 'html') {
                          htmlContent = await zipEntry.async("string");
                        } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension || '')) {
                          base64ImageMap[relativePath] = (await this.convertBase64ContenttoUrl(relativePath.split("/").pop() as string, await zipEntry.async('base64')) as any).url;
                        }
                      }
                    }));
                    if (htmlContent) {
                      Object.keys(base64ImageMap).forEach((key: string) => {
                        htmlContent = htmlContent.replace(new RegExp(`src="${key}"`, "g"), `src="${base64ImageMap[key]}"`);
                      });
                      this.template.emailContent.html_message = htmlContent;
                      event.target.value = "";
                    } else {
                      event.target.value = "";
                      this.notifiService.hideLoader();
                      this.notifiService.toster.error('The Upload Zip file must be in the format of an HTML file');
                    }
                  }
                  catch (err) {
                    this.notifiService.toster.error(err);
                    this.notifiService.hideLoader();
                  }
                  this.notifiService.hideLoader();
                };
              }
              else {
                event.target.value = "";
                this.notifiService.hideLoader();
                this.notifiService.toster.error('The Upload file must be in the format of a Zip file');
              }
            }
            catch (err: any) {
              this.notifiService.hideLoader();
              this.notifiService.toster.error(err);
              console.log(err);
            }
            break;
          }
          case "HTMLFILE": {
            if (selectedFile.type == "text/html") {
              reader.readAsText(selectedFile);
              reader.onloadend = () => {
                this.template.emailContent.html_message = reader.result;
                event.target.value = "";
                this.notifiService.hideLoader();
              };
            } else {
              event.target.value = "";
              this.notifiService.toster.error('The Upload file must be in the format of an HTML file');
              this.notifiService.hideLoader();
            }
            break;
          }
          case "IMAGEFILE": {
            try {
              this.notifiService.handleSupportedFileType(selectedFile, this.notifiService.image_extensions);
              this.notifiService.handleFileSize(selectedFile, this.notifiService.maxAllowedSize);
              if ((selectedFile?.type || '').indexOf('image') !== -1) {
                reader.readAsDataURL(selectedFile);
                reader.onload = async (e: any) => {
                  // await this.convertBase64ContenttoUrl(e.target.result);
                  const imageSrc = (await this.convertBase64ContenttoUrl(selectedFile.name as string, e.target.result) as any);
                  this.insertDynamicTagforHtmlEditor(`<img src=\"${imageSrc?.url}\">`);
                  event.target.value = "";
                  this.notifiService.hideLoader();
                }
              } else {
                event.target.value = "";
                throw "The Upload file must be in the format of an Image file";
              }
            }
            catch (err: any) {
              event.target.value = "";
              this.notifiService.toster.error(err || err.message);
              this.notifiService.hideLoader();
            }
            break;
          }
          default: {
            this.notifiService.toster.error("Invalid File type");
            this.notifiService.hideLoader();
            break;
          }
        }
      } catch {
        this.notifiService.toster.error("Failed to Upload File. Please try again");
        this.notifiService.hideLoader();
      }
    }
  }

  async convertBase64ContenttoUrl(fileName: string, base64Content: any) {
    return await this.notifiService.getEmailFileUpload({ fileName, base64Content }).toPromise();
  }

  deleteUploadedFile() {
    delete this.template.emailContent.html_message;
  }
  insertDynamicTagforHtmlEditor(text: string) {
    if (this.codeMirrorComponent) {
      const doc = this.codeMirrorComponent.instance.doc;
      const selection = doc.getSelection();
      if (selection) {
        doc.replaceSelection(text);
      } else {
        const cursor = doc.getCursor();
        doc.replaceRange(text, cursor);
      }
    }
  }

  async codeMirrorFormatCode(codeMirror: any) {
    const editor = await codeMirror.instance;
    const code = editor.getValue();
    const formattedCode = Beautify.html(code, {
      indent_size: 2,
      preserve_newlines: true,
      indent_inner_html: true,
      indent_scripts: 'normal',
      end_with_newline: true
    });
    editor.setValue(formattedCode);
  }
  // Download Html Content in CodeMirror Template Create page
  async downloadHTMLFile(fileContent: any) {
    if (fileContent) {
      try {
        this.notifiService.showLoader();
        const imageRegex = new RegExp(`src=['"](${environment.image_prefix_url}.*?)['"]`, 'gm');
        let match: any;
        let updatedContent = fileContent;
        const zipFile = new JSZip();
        while ((match = imageRegex.exec(fileContent)) !== null) {
          const imageUrl = match[1];
          const imageFileName = imageUrl.split('/').pop();
          const imgFolderPath = 'img';
          const imagePath = imgFolderPath + '/' + imageFileName;
          const imageContent = await this.http.get(imageUrl, { responseType: 'blob' }).toPromise();
          if (imageContent) {
            const imageData: any = imageContent;
            zipFile.file(imagePath, imageData);
            updatedContent = updatedContent.replace(imageUrl, imagePath);
          }
        }
        zipFile.file('index.html', updatedContent);
        const zipFolder = await zipFile.generateAsync({ type: 'blob' });
        const fileBlob = new Blob([zipFolder], { type: 'application/zip' });
        await saveAs(fileBlob, `${this.template.name || "template"}.zip`);
        this.notifiService.hideLoader();
        this.notifiService.toster.success("File download successfully");
      } catch (err) {
        this.notifiService.hideLoader();
        this.notifiService.toster.error("Failed to download File please try again");
      }
    }
  }

  getEmailBase64URL(event: any) {
    try {
      const file = event.target.files[0];
      this.template.attachments.forEach((list: any) => {
        if (list.name == file.name) {
          event.target.value = "";
          throw "File name is already exist";
        }
      })
      if (file) {
        this.notifiService.handleSupportedFileType(file, this.notifiService.attachment_extensions);
        this.notifiService.handleFileSize(file, this.notifiService.maxAllowedSize);
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e: any) => {
          var attachments = {
            name: file.name,
            channel: "EMAIL",
            mime_type: file.type,
            status: "ACTIVE",
            base64Content: e.target.result.toString().replace(`data:${file.type};base64,`, "")
          }
          this.template.attachments.push(attachments);
        }
        event.target.value = "";
      }
    } catch (err: any) {
      this.notifiService.toster.error(err);
    }
  };

  async confirmationDeleteAttachment(index: any) {
    this.isModelOpen = true;
    this.modal = await this.alertController.create({
      header: 'Confirmation',
      subHeader: 'Are you sure want to delete?',
      cssClass: 'custom-alert-style',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Delete',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.modalController.dismiss();
            this.deleteEmailAttachment(index)
          },
        }
      ],
    });
    this.modal.onDidDismiss().then(() => {
      this.isModelOpen = false;
    });
    await this.modal.present();
  }

  deleteEmailAttachment(index: any) {
    this.template.attachments.splice(index, 1);
    this.notifiService.toster.success('File deleted successfully');
  }

  payloadSize(Obj: any) {
    let payloadValue = 0;
    const getLengthOrZero = (property: any) => property ? property.length : 0;
    payloadValue += getLengthOrZero(Obj.title);
    payloadValue += getLengthOrZero(Obj.message);
    payloadValue += getLengthOrZero(Obj.click_action);
    if (Obj.icon) {
      if (Obj.icon.source_type === "URL") {
        payloadValue += getLengthOrZero(Obj.icon.url);
      } else if (Obj.icon.source_type === "FILE") {
        payloadValue += environment.image_prefix_url.length + 60;
      }
    }
    if (Obj.image) {
      if (Obj.image.source_type === "URL") {
        payloadValue += getLengthOrZero(Obj.image.url);
      } else if (Obj.image.source_type === "FILE") {
        payloadValue += environment.image_prefix_url.length + 60;
      }
    }
    return payloadValue;
  }
}
