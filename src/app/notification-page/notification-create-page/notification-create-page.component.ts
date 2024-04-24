import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import * as handlebars from 'handlebars';
import { NotificationUiService } from 'src/app/services/notification-ui.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { parseISO } from 'date-fns';
import { DynamicTagsModelComponent } from 'src/app/configuration/config-template/dynamic-tags-model/dynamic-tags-model.component';
import { SwiperOptions } from 'swiper/types/swiper-options';
import { TemplatePageComponent } from 'src/app/template-page/template-page.component';
import { AnyCnameRecord } from 'dns';
import { SegmentViewPopupComponent } from 'src/app/segment-view-popup/segment-view-popup.component';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-notification-create-page',
  templateUrl: './notification-create-page.component.html',
  styleUrls: ['./notification-create-page.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('0.3s ease-in'))
    ])
  ]
})
export class NotificationCreatePageComponent implements OnInit {

  landingPageURL: string = '/notification';
  landingPageName: string = 'Notification';
  isDropdownOpen: boolean = false;
  form!: FormGroup;
  isInitTriggered: boolean = false;
  notification_id: string = '';
  notification: any = {};
  isAbTesting: boolean = false;
  isEditView: boolean = false;
  isCloneView: boolean = false;
  isScheduledNotification: boolean = false;
  scheduleTime: any;
  selectedVariantIndex: number = 0;
  userCountByAudiencePercent: number = 0;
  userCountDetails: any = {};
  singleUserCount: any = {};

  isModalOpen: boolean = false; //mobile preview
  isTemplateDisabled: boolean = false;

  matSelect = {
    dropdownFilterSearch: '',
    type: ''
  }
  templateId: any;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
  //

  channelList: any = ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'];
  directContentChannelList: any = ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS'];
  channelMap: any = {
    'EMAIL': 'Email',
    'WEB_PUSH': 'Web Push',
    'MOBILE_PUSH': 'Mobile Push',
    'SMS': 'SMS',
    'IN_APP_MESSAGE': 'In-App Message'
  };
  preview_channel_attr_map: any = {
    'EMAIL': 'emailContent',
    'WEB_PUSH': 'webPushContent',
    'MOBILE_PUSH': 'pushContent',
    'SMS': 'smsContent',
    'IN_APP_MESSAGE': 'inAppContent'
  };
  fieldChannelMap: any = {
    'title': ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH'],
    'message': ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS'],
    'image': ['WEB_PUSH', 'MOBILE_PUSH'],
    'icon': ['WEB_PUSH'],
    'click_action': ['WEB_PUSH', 'MOBILE_PUSH'],
    'attachment_upload': ['EMAIL']
  }
  preview_channel: string = '';
  preview_type: string = 'TEMPLATE';
  preview_type_list: any = ['TEMPLATE', 'PARSE_TEMPLATE', 'PARSE_USER_TEMPLATE'];
  categoryList: any = [];
  templateList: any = [];
  templateMap: any = {};
  previewTemplateMap: any = {};
  userSegmentList: any = [];
  includedSegments = [];
  excludedSegments = [];
  isDirectContentMessage: boolean = false;
  isOverrideTagValue: boolean = false;
  dynamic_tags_override: any = [];
  dynamic_tags: any = [];
  dynamicTag: any = { type: '', cursor: {} };
  systemTagList = ['first_name', 'last_name', 'name', 'email', 'phone_number', 'gender', 'date_of_birth', 'language'];
  matchedUserCount: any = {
    includedFilter: null,
    excludedFilter: null
  }

  // userCount variables
  previousData: any = { INCLUDED: [], EXCLUDED: [] };
  totalUserCount: any = null

  // preview dynamic tags variable
  previewUserDetails: any = {};
  preview_customerId: any = '';

  segmentView: any;
  userSegment: any;

  quillData = {
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
      ['link', 'image'/*, 'video'*/]                         // link and image, video
    ]
  };

  //swiper code
  @ViewChild('swiper') swiper: any;
  config: SwiperOptions = {
    slidesPerView: 'auto',
    effect: 'fade',
    allowTouchMove: false
  };

  @ViewChild('mobswiper') mobswiper: any;
  mobconfig: SwiperOptions = {
    slidesPerView: 'auto',
    effect: 'fade',
    allowTouchMove: false
  };

  math: any = Math;
  ruleTypeInclude: string = '';
  constructor(private alertController: AlertController, public notifiService: NotificationUiService,
    private router: Router, private actRouter: ActivatedRoute, private modalController: ModalController) {
    this.isAbTesting = this.router.url.startsWith('/ab-testing');
    if (this.isAbTesting) {
      this.landingPageURL = '/ab-testing';
      this.landingPageName = 'A/B Testing';
    }
  }

  ngOnInit() {

    this.init();
    if (this.swiper) {
      this.swiper.updateSwiper({});
    }
    if (this.mobswiper) {
      this.mobswiper.updateSwiper({});
    }
  }

  ionViewWillEnter() {
    this.init();
  }
  ionViewWillLeave() {
    this.isInitTriggered = false;
    this.notifiService.closeAllAlertCtrl();
  }
  resetAll() {
    this.notification_id = '';
    this.scheduleTime = '';
    this.isScheduledNotification = false;
    this.notification = {
      content: { icon: {}, image: {} },
      channels: [],
      includedSegments: [],
      excludedSegments: [],
      isBulkNotification: this.isAbTesting ? true : false,
      isScheduled: false,
    };
    if (this.isAbTesting) {
      this.notification.variants = [{ name: "Variant A", dynamic_tags_override: [] }, { name: "Variant B", dynamic_tags_override: [] }];
      this.notification.variantSettings = { audiencePercentage: 5 };
    }
    this.isDirectContentMessage = false;
    this.isOverrideTagValue = false;
    this.isTemplateDisabled = false;
    this.resetPreview();
  }

  resetPreview() {
    this.preview_channel = '';
    this.preview_type = 'TEMPLATE';
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.resetAll();
    this.notifiService.showLoader();

    this.getAllCategory();
    this.getAllUserSegment();


    this.actRouter.paramMap.subscribe((param: Params) => {
      this.notification_id = param['get']('notification_id');
      if (!this.notification_id) {
        this.notification_id = param['get']('clone_notification_id');
        if (this.notification_id) this.isCloneView = true;
      }
      if (this.notification_id) {
        if (!this.isCloneView) this.isEditView = true;
        this.getNotificationById();
      } else {
        this.validateAndLoadDefaultData();
        this.validateAndHideLoader();
      }
    });
    this.validateForm()
  }

  loadingCount: number = 3;
  validateAndHideLoader() {
    if (--this.loadingCount == 0) {
      this.notifiService.hideLoader();
    }
  }
  //
  slidePreview() {
    var preview_type = this.preview_type_list[this.preview_type_list.indexOf(this.preview_type) - 1];
    if (this.swiper) {
      this.swiper.swiperRef.slidePrev(500);
      this.preview_type = preview_type;
    }
    if (this.mobswiper) {
      this.mobswiper.swiperRef.slidePrev(500);
      this.preview_type = preview_type;
    }
  }
  slideNext() {
    var preview_type = this.preview_type_list[this.preview_type_list.indexOf(this.preview_type) + 1];
    if (this.swiper) {
      this.swiper.swiperRef.slideNext(500);
      this.preview_type = preview_type;
    }
    if (this.mobswiper) {
      this.mobswiper.swiperRef.slideNext(500);
      this.preview_type = preview_type;
    }
  }

  validateForm() {
    this.form = new FormGroup({
      Id: new FormControl(this.notification.customerId, {
        validators: [Validators.required]
      }),
      category: new FormControl(this.notification.categoryId, {
        validators: [Validators.required]
      }),
      template: new FormControl(this.notification.templateId, {
        validators: [Validators.required]
      }),
      channel: new FormControl(this.notifiService.customPopoverOptions, {
        validators: [Validators.required]
      }),
      title: new FormControl(this.notification.content.title, {
        validators: [Validators.required]
      }),
      body: new FormControl(this.notification.content.message, {
        validators: [Validators.required]
      }),
      scheduledStartDateTime: new FormControl(this.scheduleTime, {
        validators: [Validators.required]
      }),
    });
  }
  renderdata(data: any, key: string) {
    if (data[key]) {
      var value = data[key];
      if (data[key] instanceof Array) {
        if (data[key].length == 0) return;
        data[key] = [];
      } else {
        delete data[key];
      }
      setTimeout(() => data[key] = value, 10);
    }
  }
  getAllCategory() {
    this.notifiService.getAllActiveCategoryNameList().subscribe({
      next: (categoryList: any) => {
        this.validateAndHideLoader();
        this.categoryList = categoryList.data;
        this.renderdata(this.notification, 'categoryId');
      },
      error: (err: any) => {
        this.validateAndHideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }
  getAllTemplateByCategoryId(categoryId: any) {
    if (categoryId) {
      this.notifiService.showLoader();
      this.notifiService.getAllTemplate({ categoryId }).subscribe(
        {
          next: (templateList: any) => {
            if (categoryId == this.notification.categoryId) {
              this.templateList = templateList.data;
              this.templateList.forEach((template: any) => {
                return this.templateMap[template.id] = template;
              });
              if (this.isAbTesting) {
                this.notification.variants.forEach((variant: any) => {
                  this.renderdata(variant, 'templateId');
                });
              } else {
                this.renderdata(this.notification, 'templateId');
                this.renderdata(this.notification, 'channels');
              }
            }
            this.notifiService.hideLoader();
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'Failed');
          }
        }
      );
      this.notifiService.hideLoader();
    }
  }

  getAllUserSegment() {
    this.notifiService.getAllUserSegment().subscribe({
      next: (userSegmentList: any) => {
        this.validateAndHideLoader();
        this.userSegmentList = userSegmentList.data;
        if ((this.isEditView || this.isCloneView) && this.notification.isBulkNotification) {
          this.renderdata(this, 'includedSegments');
          this.renderdata(this, 'excludedSegments');
        }
      },
      error: (err: any) => {
        this.validateAndHideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }
  validateAndLoadDefaultData() {
    this.notification.content = this.notification.content || {};
    this.notification.content.image = this.notification.content.image || {};
    this.notification.content.icon = this.notification.content.icon || {};
    this.includedSegments = (this.notification.includedSegments || []).map((obj: any) => obj.id);
    this.excludedSegments = (this.notification.excludedSegments || []).map((obj: any) => obj.id);
    this.notification.attachments = this.notification.attachments || [];
  }
  getNotificationById() {
    this.notifiService.getNotificationById(this.notification_id, this.isAbTesting).subscribe(async (notification: any) => {
      notification.attachments = notification.attachments || [];
      if (this.isCloneView) this.notifiService.cleanClonedObject(notification, 'notification');
      this.notification = notification;
      this.loadTemplatePreviewByTemplateId();
      this.includedSegments = (notification.includedSegments || []).map((obj: any) => obj.id);
      this.excludedSegments = (notification.excludedSegments || []).map((obj: any) => obj.id);
      if (this.notification.isBulkNotification) {
        if (this.includedSegments.length > 0) this.getNotificationUserCount(this.includedSegments, 'INCLUDED');
        if (this.excludedSegments.length > 0) this.getNotificationUserCount(this.excludedSegments, 'EXCLUDED');
      } else {
        if (this.notification.customerId) await this.getActivateChannelOfSingleUser(this.notification.customerId, false);
      }
      this.validateAndLoadDefaultData();
      if (this.notification.scheduledAt) {
        if (this.notification.status != 'CREATED') this.isScheduledNotification = true;
        this.scheduleTime = new Date(parseISO(this.notification.scheduledAt));
      }
      if (this.isAbTesting) {
        this.isDirectContentMessage = false;
        this.notification.channel = this.notification.channels[0];
        this.notification.variants.forEach((variant: any) => {
          variant.dynamic_tags_override = Object.keys((variant.data || {})).map((name: string) => {
            return { name, value: variant.data[name] };
          });
          variant.isOverrideTagValue = variant.dynamic_tags_override.length > 0;
        });
        this.loadTemplatePreviewByTemplateId();
      } else {
        if (this.notification.templateId) {
          this.isDirectContentMessage = false;
          this.dynamic_tags_override = Object.keys((this.notification.data || {})).map((name: string) => {
            return { name, value: this.notification.data[name] };
          });
          this.isOverrideTagValue = this.dynamic_tags_override.length > 0;
          this.loadTemplatePreviewByTemplateId();
        } else {
          this.isDirectContentMessage = true;
          this.dynamic_tags = Object.keys((this.notification.data || {})).map((name: string) => {
            return { name, value: this.notification.data[name] };
          });
        }
      }

      if (this.notification.categoryId) {
        this.getAllTemplateByCategoryId(this.notification.categoryId);
      }
      this.validateAndHideLoader();
    });
  }

  onAudienceChange(isBulkNotification: boolean) {
    if (this.notification.isBulkNotification != isBulkNotification) {
      this.notification.isBulkNotification = isBulkNotification;
      this.notification.channels = [];
      this.resetPreview();
      this.previewUserId(isBulkNotification);
    }
  }
  onMessageTypeChange(isDirectContentMessage: boolean) {
    if (!this.isAbTesting && this.isDirectContentMessage != isDirectContentMessage) {
      this.isDirectContentMessage = isDirectContentMessage;
      if (!isDirectContentMessage) {
        this.notification.channels = [];
        this.resetPreview();
      }
    }
  }
  onCategorySelect() {
    if (!this.isDropdownOpen) return;
    if (this.isAbTesting) {
      this.notification.variants.forEach((variant: any) => variant.templateId = '');
      this.notification.channel = '';
    } else {
      this.notification.templateId = '';
    }
    this.notification.channels = [];
    this.resetPreview();
    this.getAllTemplateByCategoryId(this.notification.categoryId);
  }
  onVariantSelect(selectedVariantIndex: number) {
    this.selectedVariantIndex = selectedVariantIndex;
    this.loadTemplatePreviewByTemplateId();
  }
  onTemplateSelect() {
    if (!this.isDropdownOpen) return;
    if (!this.isAbTesting) {
      this.notification.channels = [];
      this.resetPreview();
    }
    this.loadTemplatePreviewByTemplateId();
  }
  loadTemplatePreviewByTemplateId() {
    var templateId: any = null;
    if (this.isAbTesting) {
      templateId = this.notification.variants[this.selectedVariantIndex].templateId;
    } else {
      templateId = this.notification.templateId;
    }
    this.templateId = templateId;

    if (templateId && !this.previewTemplateMap[templateId]) {
      this.notifiService.getTemplateById(templateId).subscribe({
        next: (template: any) => {
          this.previewTemplateMap[templateId] = template;
        },
        error: (err: any) => {
          err = err.error?.error || err.error || err;
          if (err) {
            this.notification.channels = [];
            this.notification.templateId = 0;
            this.resetPreview();
          }
        }
      });
    }

  }
  onChannelSelect() {
    if ((this.isAbTesting && !this.notification.hasOwnProperty("channel")) ||
      (!this.isAbTesting && !this.notification.hasOwnProperty("channels"))) return;

    if (!this.notification.channel) {
      this.resetPreview();
    }
    if (this.isAbTesting) {
      if (this.notification.channel) {
        this.preview_channel = this.notification.channel;
        this.notification.channels = [this.notification.channel];
      } else {
        this.notification.channels = [];
      }
      this.notification.variants.forEach((variant: any) => {
        if (this.templateMap[variant.templateId] && ((this.templateMap[variant.templateId] || {}).channels || []).indexOf(this.notification.channel) == -1) {
          variant.templateId = '';
        }
      });
    }
    var channels = this.notification.channels || [];
    if (channels.indexOf(this.preview_channel) == -1 && this.preview_channel == '') {
      this.preview_channel = channels[0] || '';
    }
  }
  isValidFieldToShow(fieldName: string) {
    const elidgibleChannelList = this.fieldChannelMap[fieldName] || [];
    return elidgibleChannelList.find((channel: any) => (this.notification.channels || []).indexOf(channel) != -1) != null;
  }
  isValidNotification(notification: any) {
    try {
      if (notification.isBulkNotification == true) {
        if (this.includedSegments.length == 0 && this.excludedSegments.length == 0) throw 'Please Select Either Included Segments or Excluded Segments';
        if (this.includedSegments.length != 0 && this.excludedSegments.length != 0) throw 'Please Select Either Included Segments or Excluded Segments';
      } else {
        if (!notification.customerId) throw 'Please enter User Id';
      }
      if (!notification.categoryId) throw 'Please Select Category';
      if (!notification.channel && this.isAbTesting) throw 'Please Select Channel';
      if (this.isAbTesting) {
        notification.variants.forEach((variant: any, index: number) => {
          try {
            if (!variant.name) throw 'Please Enter Variant Name';
            if (!variant.templateId) throw 'Please Select Template';
            if (variant.isOverrideTagValue &&
              ((this.previewTemplateMap[variant.templateId] || {}).dynamic_tags || []).length > 0 &&
              variant.dynamic_tags_override.length > 0) {
              variant.data = {};
              variant.dynamic_tags_override.forEach((tag: any) => {
                if (tag.name) variant.data[tag.name] = tag.value;
              });
            }
            delete variant.isOverrideTagValue;
            delete variant.dynamic_tags_override;
          } catch (e) {
            this.selectedVariantIndex = index;
            throw e;
          }
        });
        var audiencePercentage = notification.variantSettings.audiencePercentage;
        if (audiencePercentage < 1) throw 'Target Audience percentace should be greater than 0';
        // debugger;
        if ((((this.userCountDetails[notification.channel] || 0) / 100) * notification.variantSettings.audiencePercentage) < notification.variants.length) {
          throw 'At least 1 recipient per variant is required';
        }
      } else {
        if (this.isDirectContentMessage) {
          notification.templateId = null;
          if (notification.channels.length == 0) throw 'Please Select Channels';
          if (this.isValidFieldToShow('title') && !notification.content.title) throw 'Please Enter Title';
          if (this.isValidFieldToShow('message') && !notification.content.message) throw 'Please Enter Message';
          if (this.notification.channels.indexOf('MOBILE_PUSH') !== -1 || this.notification.channels.indexOf('WEB_PUSH') !== -1) {
            if (this.payloadSize(this.notification.content) > 4078) {
              if (this.notification.channels.indexOf('MOBILE_PUSH') !== -1 && this.notification.channels.indexOf('WEB_PUSH') !== -1) {
                throw new Error('MOBILE PUSH and WEB PUSH content size exceeds the maximum allowed limit.');
              } else if (this.notification.channels.indexOf('MOBILE_PUSH') !== -1) {
                throw new Error('MOBILE PUSH content size exceeds the maximum allowed limit.');
              } else {
                throw new Error('WEB PUSH content size exceeds the maximum allowed limit.');
              }
            }
          }
        } else {
          if (!notification.templateId) throw 'Please Select Template';
          if (notification.channels.length == 0) throw 'Please Select Channels';
        }

      }
      if (notification.isScheduled) {
        if (!this.scheduleTime) throw 'Please Select Scheduled Date';
        if (new Date().getTime() >= this.scheduleTime.getTime()) throw 'Please Select Future Date';
        notification.scheduledAt = this.scheduleTime.getTime();
      }
      //cleanup code
      if (notification.templateId) notification.content = null;
      if (!notification.isScheduled) notification.scheduledAt = null;
      if (notification.isBulkNotification == true) {
        if (notification.customerId) notification.customerId = null;
        notification.includedSegments = this.includedSegments.map(id => { return { id } });
        notification.excludedSegments = this.excludedSegments.map(id => { return { id } });
      } else {
        if (notification.included_segments) notification.includedSegments = [];
        if (notification.excluded_segments) notification.excludedSegments = [];
      }
      if (!this.isAbTesting) {
        if (this.isDirectContentMessage) {
          notification.data = {};
          this.dynamic_tags.forEach((tag: any) => {
            if (tag.name) notification.data[tag.name] = tag.value;
          });
        } else if (this.isOverrideTagValue &&
          ((this.previewTemplateMap[notification.templateId] || {}).dynamic_tags || []).length > 0 &&
          this.dynamic_tags_override.length > 0) {
          notification.data = {};
          this.dynamic_tags_override.forEach((tag: any) => {
            if (tag.name) notification.data[tag.name] = tag.value;
          });
        }
      }
      return true;
    } catch (err) {
      this.notifiService.toster.error(err);
    }
    return false;
  }
  saveAsDraft() {
    if (!this.isDirectContentMessage) {
      delete this.notification.content;
    } else {
      this.notification.templateId = null;
      this.notification.template = null;
    }
    var notification = JSON.parse(JSON.stringify(this.notification));
    if (!this.isValidNotification(notification)) return;
    this.notifiService.showLoader();
    if (this.isEditView) {
      this.notifiService.updateDraftNotification(this.notification_id, notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Updated Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || (this.landingPageName + ' Update Failed'));
        }
      });
    } else {
      this.notifiService.saveDraftNotification(notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Created Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || (this.landingPageName + ' Create Failed'));
        }
      });
    }
  }
  sendNotification() {
    try {
      if (this.totalUserCount == 0) {
        throw 'No user found'
      }
      var notification = JSON.parse(JSON.stringify(this.notification));
      if (!this.isValidNotification(notification)) return;
      this.notifiService.showLoader();
      this.notifiService.sendNotification(notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Initiated Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || (this.landingPageName + ' Failed to Initiate'));
        }
      });
    } catch (err: any) {
      this.notifiService.hideLoader();
      err = err.error?.error || err.error || err;
      this.notifiService.toster.error(err);
    }
  }
  scheduleNotification() {
    try {
      if (this.totalUserCount == 0) {
        throw 'No user found'
      }
      var notification = JSON.parse(JSON.stringify(this.notification));
      if (!this.isValidNotification(notification)) return;
      this.notifiService.showLoader();
      this.notifiService.scheduleNotification(notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Scheduled Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || ('Failed to Schedule ' + this.landingPageName));
        }
      });
    } catch (err: any) {
      this.notifiService.hideLoader();
      err = err.error?.error || err.error || err;
      this.notifiService.toster.error(err);
    }
  }
  //onCancel popup
  async onCancel() {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made may not be saved.',
      cssClass: 'custom-alert-style',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm',
          handler: () => { this.router.navigate([this.landingPageURL]) }
        },
      ],
    });
    await alert.present();
  }

  async dynamicTagModel() {
    var modal = await this.modalController.create({
      component: DynamicTagsModelComponent,
      cssClass: 'dynamic-tag-model',
      componentProps: {
        template: { dynamic_tags: this.dynamic_tags },
        isTemplateScreen: false
      },
      backdropDismiss: false
    });
    await modal.present();
  }
  _addSelectedTag(obj: any, key: string, value: string) {
    var data = obj[key] || '';
    if (this.dynamicTag.cursor.hasOwnProperty('start')) {
      obj[key] = data.slice(0, this.dynamicTag.cursor.start) + '{{ ' + value + ' }}' + data.slice(this.dynamicTag.cursor.end);
    } else {
      obj[key] = data + '{{ ' + value + ' }}';
    }
    this.dynamicTag.cursor = {};
    return true;
  }
  addSelectedTag(tag: string) {
    switch (this.dynamicTag.type) {
      case 'TITLE': return this._addSelectedTag(this.notification.content, 'title', tag);
      case 'MESSAGE': return this._addSelectedTag(this.notification.content, 'message', tag);
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
  showDynamicContentPopup(type: string) {
    if (this.dynamicTag.cursor.type != type) {
      this.dynamicTag.cursor = {};
    }
    this.dynamicTag.type = type;
  }
  addOverrideDynamicTag(dynamic_tags_override: any) {
    dynamic_tags_override.push({ name: '' });
  }
  removeOverrideDynamicTag(dynamic_tags_override: any, index: any) {
    dynamic_tags_override.splice(index, 1);
  }

  getDynamicTagDetails() {
    const data: any = {};
    var templateId = this.notification.templateId;
    var isOverrideTagValue = this.isOverrideTagValue;
    var dynamic_tags_override = this.dynamic_tags_override;
    if (this.isAbTesting) {
      var obj = this.notification.variants[this.selectedVariantIndex];
      templateId = obj.templateId;
      isOverrideTagValue = obj.isOverrideTagValue;
      dynamic_tags_override = obj.dynamic_tags_override;
    }

    if (this.isDirectContentMessage) {
      this.dynamic_tags.forEach((tag: any) => {
        if (tag.name) data[tag.name] = tag.value;
      });
    } else if (((this.previewTemplateMap[templateId] || {}).dynamic_tags || []).length > 0) {
      this.previewTemplateMap[templateId].dynamic_tags.forEach((tag: any) => {
        if (tag.name) data[tag.name] = tag.value;
      });
      if (isOverrideTagValue && dynamic_tags_override.length > 0) {
        dynamic_tags_override.forEach((tag: any) => {
          if (tag.name) data[tag.name] = tag.value;
        });
      }
    }
    return data;
  }

  updateData(event: any) {
    this.notification.content = event;
  }
  scrollContent(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  countApiTriggerCount: number = 0;
  async getNotificationUserCount(segmentIdList: any, rule_type: string) {
    try {
      this.ruleTypeInclude = '';
      var previousRuletype = this.previousData.key;
      var previousSegmentIdList = this.previousData[rule_type].join(',');
      var newSegmentIdList = segmentIdList.join(',');

      if ((previousRuletype != rule_type || previousSegmentIdList != newSegmentIdList) && segmentIdList.length) {
        this.previousData[rule_type] = JSON.parse(JSON.stringify(segmentIdList));
        this.previousData.key = rule_type;
        this.totalUserCount = null;
        if (rule_type == 'INCLUDED') {
          this.notification.includedSegments = segmentIdList.map((id: any) => {
            return { id };
          });
        } else {
          this.notification.excludedSegments = segmentIdList.map((id: any) => {
            return { id };
          });
        }

        if (segmentIdList.length > 0) {
          if (rule_type == 'INCLUDED') {
            this.ruleTypeInclude = 'INCLUDED';
            this.excludedSegments = [];
            this.notification.excludedSegments = [];
          } else {
            this.includedSegments = [];
            this.notification.includedSegments = [];
          }
          ++this.countApiTriggerCount;
          this.userSegment = await this.notifiService.getNotificationUserCount({ segment_id_list: segmentIdList.join(',') }).toPromise();
          let getCountSegementUsers;
          getCountSegementUsers = await this.notifiService.getUserSegementUsers({ rule_type, rules: this.userSegment.rules, channels: ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'] }).toPromise();
          this.userCountDetails = await this.notifiService.getUserCountByRules({ rule_type, rules: this.userSegment.rules, channels: ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'] }).toPromise();
          this.notification.channels = this.notification.channels.filter((channel: string) => this.userCountDetails[channel] != 0);
          if (this.notification.channels.indexOf(this.preview_channel) == -1) {
            this.preview_channel = this.notification.channels[0] || "";
          }
          if (this.isAbTesting) {
            this.notification.channel = this.notification.channels[0] || "";
            this.renderdata(this.notification, "channel");
          } else {
            this.renderdata(this.notification, "channels");
          }
          if (--this.countApiTriggerCount == 0) {
            this.totalUserCount = getCountSegementUsers.length;
          }
        }
      }
    } catch (err: any) {
      --this.countApiTriggerCount;
      err = err.error?.error || err.error || err;
      this.notifiService.toster.error(err.message);
    }
  }

  getUserData() {
    this.previewUserDetails = {};
    if (!this.notification.isBulkNotification) this.preview_customerId = this.notification.customerId;
    if (this.preview_customerId) {
      this.notifiService.getAllUserProfileByID(this.preview_customerId, { response_type: 'USER_ROOT_DETAILS' }).subscribe({
        next: (previewUserDetails: any) => {
          this.previewUserDetails = previewUserDetails;
        },
        error: (err: any) => {
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || 'Failed');
        }
      });
    }
  }

  async modalPresent(content: AnyCnameRecord) {
    try {
      const activeSliderIndex = document.getElementsByClassName("swiper-slide swiper-slide-active")[0].getAttribute("data-swiper-slide-index");
      const isFirstSlide = activeSliderIndex == "0";
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: this.preview_channel,
          content: content,
          isPreviewPopup: true,
          isEmailReadOnly: isFirstSlide ? !this.isDirectContentMessage : true,
          isFullScreenEditor: true,
          needTemplateParser: isFirstSlide ? false : true,
          systemTagDetails: isFirstSlide ? null : this.previewUserDetails,
          dynamicTagDetails: isFirstSlide ? null : this.getDynamicTagDetails()
        },
        backdropDismiss: false
      });
      await modal.present();
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }
  updateTargetedAudience(event: any) {
    const value = parseInt(event.target.value, 10);
    if (value > 100) {
      event.target.value = '100';
    }
    if (value < 0) {
      event.target.value = '0';
    }
  }
  dateFormat(event: any) {
    const value = event.target.value;

  }

  addEvent(type: string, event: any) {
    event.value.setSeconds(0);
    this.renderdata(this, 'scheduleTime')
  }


  async openSegmentViewPopup() {
    const modal = await this.modalController.create({
      component: SegmentViewPopupComponent,
      cssClass: 'view-user',
      componentProps: {
        type: this.ruleTypeInclude == 'INCLUDED' ? 'INCLUDED' : 'EXCLUDED',
        usersegementRules: this.userSegment.rules,
        userName: null,
      },
      backdropDismiss: false
    });
    await modal.present();
    this.ruleTypeInclude = '';
  }

  filterWithType(type: any) {
    this.matSelect.type = type;
  }
  async getActivateChannelOfSingleUser(id: number, showLoader: boolean = false) {
    if (showLoader) this.notifiService.showLoader();
    try {
      this.singleUserCount = await this.notifiService.getActivateChannelOfSingleUser(id).toPromise();
      this.notification.channels = this.notification.channels.filter((channel: string) => this.singleUserCount[channel] != 0);
      if (this.notification.channels.indexOf(this.preview_channel) == -1) {
        this.preview_channel = this.notification.channels[0] || "";
      }
      this.renderdata(this.notification, "channels");
      this.getUserData();
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      this.notifiService.toster.error(err.message);
    }
    if (showLoader) this.notifiService.hideLoader();
  }
  previewUserId(isBulkNotification: boolean) {
    if (isBulkNotification) {
      this.preview_customerId = null;
    } else {
      this.preview_customerId = this.notification.customerId;
    }
    this.getUserData();
  }

  getEmailBase64URL(event: any) {
    try {
      const file = event.target.files[0];
      if (file) {

        // check file name same in notification and template
        this.previewTemplateMap[this.notification.templateId]?.attachments.forEach((tempList: any) => {
          if (tempList.name == file.name) {
            event.target.value = "";
            throw "File name is already exist";
          }
        })
        this.notification.attachments.forEach((list: any) => {
          if (list.name == file.name) {
            event.target.value = "";
            throw "File name is already exist";
          }
        })
        this.notifiService.handleSupportedFileType(file, this.notifiService.attachment_extensions);
        this.notifiService.handleFileSize(file, this.notifiService.maxAllowedSize);
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e: any) => {
          this.notification.attachments.push({
            name: file.name,
            channel: "EMAIL",
            mime_type: file.type,
            status: "ACTIVE",
            base64Content: e.target.result.toString().replace(`data:${file.type};base64,`, "")
          });
        }
        event.target.value = "";
      }
    } catch (err: any) {
      event.target.value = "";
      this.notifiService.toster.error(err);
    }
  };

  async confirmationDeleteAttachment(index: any) {
    var modal = await this.alertController.create({
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
    modal.onDidDismiss().then(() => {
      this.isModalOpen = false;
    });
    await modal.present();
  }

  deleteEmailAttachment(index: any) {
    this.notification.attachments.splice(index, 1);
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
