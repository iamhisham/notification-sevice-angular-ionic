import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Preferences } from '@capacitor/preferences';
import { AlertController, LoadingController, ModalController, PopoverController, ToastController } from '@ionic/angular';
import jwt_decode from 'jwt-decode';
import { saveAs } from 'file-saver';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConstantService } from './constant.service';


@Injectable({
  providedIn: 'root'
})

export class NotificationUiService {
  errorviewList(params: any) {
    throw new Error('Method not implemented.');
  }

  /* Theme change variable */
  // themeName: string = 'dot-mobile';
  themeName: string = document.body.classList[0];

  URL = environment.URL;
  image_prefix_url = environment.image_prefix_url;
  date_format: string = 'dd-MMM yy';
  time_format: string = 'hh:mm a';
  date_time_format: string = 'dd-MMM yy hh:mm a';
  // default_limit: number = 100;
  userDetails: any = {};
  duration: number = 2000;

  tokenBufferTime: number = 1 * 60 * 1000; // 1 Min
  tokenTimer: any = null;
  maxAllowedSize = 2 * 1024 * 1024; //2mb
  image_extensions: any = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
  attachment_extensions: any = [".pdf", ".xls", ".xlsx", ".csv", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".ppt", "pptx", ".doc", "docx"];

  excludeRetryErrorCodeList = ['ERR-3001', 'ERR-3002', 'ERR-4001'];

  isTempPopup = false;

  errorCodeList: any = [
    {
      "error_code": "ERR-2001",
      "error_msg": "Lambda throttling error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-2002",
      "error_msg": "Lambda timed out error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-2003",
      "error_msg": "Any other Lambda error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-3001",
      "error_msg": "User not found",
      "error_retry": "No"
    },
    {
      "error_code": "ERR-3002",
      "error_msg": "Channel not found",
      "error_retry": "No"
    },
    {
      "error_code": "ERR-3003",
      "error_msg": "Not enough user for AB_Testing",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-4001",
      "error_msg": "Firebase invalid or not registered identifier error",
      "error_retry": "No"
    },
    {
      "error_code": "ERR-4002",
      "error_msg": "Firebase Web_Push error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-4003",
      "error_msg": "Firebase Mobile_Push error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-4101",
      "error_msg": "SES error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-4102",
      "error_msg": "SES email not verified error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-4201",
      "error_msg": "SNS error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-4301",
      "error_msg": "SMPT error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-5001",
      "error_msg": "Code logic error",
      "error_retry": "Manual"
    },
    {
      "error_code": "ERR-6001",
      "error_msg": "Redis error",
      "error_retry": "Manual"
    },
  ];

  private sessionDataSubject = new BehaviorSubject<any>(null);
  sessionData$ = this.sessionDataSubject.asObservable();

  setSessionData(data: any) {
    this.sessionDataSubject.next(data);
  }

  constructor(private http: HttpClient, private toastController: ToastController,
    private alertController: AlertController, private router: Router,
    public loadingCtrl: LoadingController, private modalController: ModalController,
    public popoverController: PopoverController, private cookieService: CookieService,
    private constantService: ConstantService) {
    this.validateToken();
    this.init();
  }

  async init() {
    var userData: any = await this.storage.get('login-user-Details');
    if (userData) {
      this.userDetails = JSON.parse(userData);
    }
  }

  storage = {
    get: async (key: string) => {
      return ((await Preferences.get({ key })) || {}).value;
    },
    set: async (key: string, value: string) => {
      return await Preferences.set({ key, value });
    },
    remove: async (key: string) => {
      return await Preferences.remove({ key });
    },
    clear: async () => {
      return await Preferences.clear();
    },
  };

  hasToken() {
    return this.cookieService.get('XSRF-TOKEN') ? true : false;
  }

  hasValidToken(token = this.cookieService.get('XSRF-TOKEN')) {
    if (token) {
      const decode: any = jwt_decode(token);
      return (decode.exp * 1000) > new Date().getTime();
    }
    return false;
  }

  validateToken() {
    if (this.tokenTimer) clearInterval(this.tokenTimer);
    const token = this.cookieService.get('XSRF-TOKEN');
    if (token && this.hasValidToken(token)) {
      const decode: any = jwt_decode(token);
      const expDuration = (decode.exp * 1000) - new Date().getTime();
      if (expDuration > this.tokenBufferTime) {
        this.tokenTimer = setTimeout(this.renewTokenAndUpdateCookie, (expDuration - this.tokenBufferTime));
      } else {
        this.renewTokenAndUpdateCookie();
      }
    }
  }

  async renewTokenAndUpdateCookie() {
    try {
      const details: any = await this.renewToken().toPromise();
      this.setTokenToCookie(details);
      this.validateToken();
      return true;
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      this.toster.error(err.message || 'Token Renew Failed');
      await this.deleteLoginDetails();
    }
    return false;
  }

  setTokenToCookie(details: any) {
    if (details['XSRF-TOKEN'] && details['X-XSRF-TOKEN']) {
      const date = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
      this.cookieService.set('XSRF-TOKEN', details['XSRF-TOKEN'], date, "/");
      this.cookieService.set('X-XSRF-TOKEN', details['X-XSRF-TOKEN'], date, "/");
    }
  }

  async deleteLoginDetails() {
    this.cookieService.delete('XSRF-TOKEN');
    this.cookieService.delete('X-XSRF-TOKEN');
    this.cookieService.deleteAll();
    await this.storage.remove("login-user-Details");
  }

  customPopoverOptions: any = {
    cssClass: 'popover-wide',
  };
  segementioncutsomPopover: any = {
    cssClass: 'checkbox-popover',
  };
  toster = {
    success: (message: string) => {
      this.duration = 2000;
      this.toster.show('SUCCESS', message);
    },
    error: (message: any) => {
      this.duration = 5000;
      this.toster.show('ERROR', message);
    },
    show: async (type: string, message: any) => {
      const toast = await this.toastController.create({
        message: message,
        duration: this.duration,
        icon: type == 'SUCCESS' ? 'checkmark-outline' : 'close-outline',
        cssClass: type == 'SUCCESS' ? 'toaster-style' : 'cancel-toaster-style',
        position: 'bottom',
      });
      await toast.present();
    }
  };

  async showCancelConfirmation(routerValue: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made may not be saved.',
      cssClass: 'custom-alert-style',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => { this.router.navigate(routerValue); }
        },
      ],
    });
    await alert.present();
  }

  //alertClose Control
  async closeAllAlertCtrl() {
    var alertCtrl = await this.alertController.getTop();
    if (alertCtrl) await alertCtrl.dismiss();
    var modalCtrl = await this.modalController.getTop();
    if (modalCtrl) await modalCtrl.dismiss();
    var popoverCtrl = await this.popoverController.getTop();
    if (popoverCtrl) await popoverCtrl.dismiss();
    var loaderCtrl = await this.loadingCtrl.getTop();
    if (loaderCtrl) await loaderCtrl.dismiss();
  }

  //spinner controller
  isLoaderDismissed: boolean = false;
  async showLoader() {
    this.isLoaderDismissed = false;
    const loader = await this.loadingCtrl.create({
      message: 'Please wait...',
      spinner: 'lines-sharp',
      cssClass: 'ion-loading-class',
      translucent: true
    });
    if (!this.isLoaderDismissed && !(await this.loadingCtrl.getTop())) {
      await loader.present();
    }
  }

  async hideLoader() {
    try {
      this.isLoaderDismissed = true;
      if (await this.loadingCtrl.getTop()) {
        await this.loadingCtrl.dismiss();
      }
    } catch (e) {
      console.log(e);
    }
  }

  handleSupportedFileType(file: any, allowedExtensions: []) {
    const fileName = file.name.toLowerCase();
    if (!allowedExtensions.some((ext: any) => fileName.endsWith(ext))) {
      throw new Error("Unsupported file type!");
    }
  }

  handleFileSize(file: any, size: any) {
    if (file.size > size) {
      throw "File must not exceed 2 MB!";
    }
  }

  cleanClonedObject(obj: any, key: string) {
    const attrDetails: any = {
      category: ['id', 'status', 'createdAt', 'updatedAt'],
      template: ['id', 'status', 'createdAt', 'updatedAt'],
      userSegment: ['id', 'status', 'createdAt', 'updatedAt'],
      notification: ['id', 'status', 'createdAt', 'updatedAt', 'is_processed', 'processed_at', 'user_count', 'config_data']
    };
    attrDetails[key].forEach((key: any) => delete obj[key]);
    if (key == "notification") {
      (obj.variantList || []).forEach((variant: any) => {
        delete variant.id;
        delete variant.notification_id;
      });

      (obj.attachmentList || []).forEach((list: any) => {
        list.clone_id = list.id;
        delete list.id;
      });
    }
    if (key == "template") {
      (obj.attachmentList || []).forEach((list: any) => {
        list.clone_id = list.id;
        delete list.id;
      });
    }
  }

  async downlaodEmailAttachment(attachment: any) {
    try {
      if (attachment.id) {
        await this.showLoader();
        const downloadData: any = attachment.template_id ?
          await this.downloadTemplateAttachmentById(attachment.template_id, attachment.id).toPromise() :
          await this.downloadNotificationAttachmentById(attachment.notification_id, attachment.id).toPromise();
        var base64Content = `data:${downloadData.mime_type};base64,${downloadData.base64Content}`;
        const blob = await fetch(base64Content).then(async (response) => { return await response.blob(); });
        saveAs(blob, downloadData.name);

        this.hideLoader();
        this.toster.success("File download successfully");
      }
    } catch (err) {
      this.hideLoader();
      console.log(err);
      this.toster.error("Failed to download File please try again");
    }
  }
  onInputChange(event: any) {
    const value = event.target.value;
    const dateRange = value.split('~').map((date: string) => date.trim());
    if (dateRange.length === 2) {
      const startDate: any = new Date(dateRange[0]);
      const endDate: any = new Date(dateRange[1]);
      return [startDate, endDate];
    }
    return '';
  }
  dateFormat(date: any) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date;
  }

  //Auth
  signup(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/auth/signup`, data);
  }

  login(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/auth/login`, data);
  }

  logout() {
    return this.http.post<any>(`${this.URL}/cdp/auth/logout`, {});
  }

  confirmForgotPassword(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/auth/forgot-password/confirm`, data);
  }

  resetPassword(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/auth/forgot-password`, data);
  }

  resendConfirmation(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/auth/forgot-password/resend`, data);
  }

  confirmRegistration(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/auth/signup/confirm`, data);
  }

  createPassword(data: any) {
    return this.http.post<any>(`${this.URL}cdp/auth/set-password`, data);
  }

  renewToken() {
    return this.http.post<any>(`${this.URL}/cdp/auth/token/renew`, {});
  }

  deleteAdminById(id: any) {
    return this.http.delete(`${this.URL}/cdp/auth/delete-admin/${id}`);
  }

  //category
  getAllCategory(params: any = {}) {
    const { embed } = this.constantService.CATEGORY.GET_ALL;
    return this.http.get<any>(`${this.URL}/cdp/notifications/categories`, { params: { ...params, embed } });
  }

  getAllActiveCategoryNameList() {
    const { embed, params } = this.constantService.CATEGORY.GET_ALL_NAME;
    return this.http.get<any>(`${this.URL}/cdp/notifications/categories`, { params: { ...params, embed } });
  }

  getCategoryById(category_id: any) {
    return this.http.get(`${this.URL}/cdp/notifications/categories/${category_id}`);
  }

  createCategoty(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/notifications/categories`, data);
  }

  updateCategoryById(category_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/notifications/categories/${category_id}`, data);
  }

  deleteCategoryById(category_id: any) {
    return this.http.delete<any>(`${this.URL}/cdp/notifications/categories/${category_id}`);
  }

  //Template
  getAllTemplate(params = {}) {
    const { embed } = this.constantService.TEMPLATE.GET_ALL;
    return this.http.get<any>(`${this.URL}/cdp/notifications/templates`, { params: { ...params, embed } });
  }

  getTemplateById(template_id: any) {
    const { embed }: any = this.constantService.TEMPLATE.GET_ALL;
    return this.http.get(`${this.URL}/cdp/notifications/templates/${template_id}`, embed);
  }

  createTemplate(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/notifications/templates`, data);
  }

  updateTemplateById(template_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/notifications/templates/${template_id}`, data);
  }

  deleteTemplateById(template_id: any) {
    return this.http.delete<any>(`${this.URL}/cdp/notifications/templates/${template_id}`);
  }

  deleteTemplateByCategoryId(category_id: any) {
    return this.http.delete<any>(`${this.URL}/cdp/notifications/categories/${category_id}/templates`);
  }

  remapCategory(data: any) {
    return this.http.put(`${this.URL}/cdp/notifications/templates/remap`, data);
  }

  //user_segement
  getAllUserSegment(params = {}) {
    const { embed } = this.constantService.USERSEGMENT.GET_ALL;
    return this.http.get(`${this.URL}/cdp/segments`, { params: { ...params, embed } });
  }

  getUserSegmentById(segment_id: any) {
    return this.http.get(`${this.URL}/cdp/segments/${segment_id}`);
  }

  createUserSegment(data: any) {
    return this.http.post<any>(`${this.URL}/cdp/segments`, data);
  }

  updateUserSegmentById(segment_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/segments/${segment_id}`, data);
  }

  deleteUserSegmentById(segment_id: any) {
    return this.http.delete(`${this.URL}/cdp/segments/${segment_id}`);
  }

  //
  getUserSegementUsers(data: any) {
    return this.http.post(`${this.URL}/cdp/customers/customerinfo-by-rule`, data);
  }
  //
  getNotificationUserCount(user_segment_id: any, params = {}) {
    return this.http.get(`${this.URL}/cdp/segments/rules`, { params: user_segment_id });
  }

  //Notification
  getAllNotification(params = {}, isAbTesting: boolean) {
    const abTestingEmberd: any = this.constantService.ABTESTING.GET_ALL;
    const notificationEmbed: any = this.constantService.NOTIFICATION.GET_ALL;
    if (isAbTesting) return this.http.get<any>(`${this.URL}/cdp/notifications/ab-tests`, { params: { ...params, ...abTestingEmberd } });
    else return this.http.get<any>(`${this.URL}/cdp/notifications`, { params: { ...params, ...notificationEmbed } });
  }

  getNotificationById(id: any, isAbTesting: boolean) {
    return this.http.get(`${this.URL}/cdp/${isAbTesting ? 'notifications/ab-tests' : 'notifications'}/${id}`);
  }

  saveDraftNotification(data: any, isAbTesting: boolean) {
    return this.http.post(`${this.URL}/cdp/${isAbTesting ? 'notifications/ab-tests' : 'notifications'}`, data);
  }

  updateDraftNotification(id: any, data: any, isAbTesting: boolean) {
    return this.http.put(`${this.URL}/cdp/${isAbTesting ? 'notifications/ab-tests' : 'notifications'}/${id}`, data);
  }

  sendNotification(data: any, isAbTesting: boolean) {
    return this.http.post(`${this.URL}/cdp/${isAbTesting ? 'notifications/ab-tests' : 'notifications'}/send`, data);
  }

  scheduleNotification(data: any, isAbTesting: boolean) {
    return this.http.post(`${this.URL}/cdp/${isAbTesting ? 'notifications/ab-tests' : 'notifications'}/schedule`, data);
  }

  deleteNotificationById(id: any, isAbTesting: boolean) {
    return this.http.delete<any>(`${this.URL}/cdp/${isAbTesting ? 'notifications/ab-tests' : 'notifications'}/${id}`);
  }

  getNotificationSummary(notification_id: any) {
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/summary`);
  }

  getABTestingSummaryByVariant(ab_test_id: any, variant_id: any) {
    return this.http.get(`${this.URL}/cdp/notifications/ab-test/${ab_test_id}/variant-id/${variant_id}/summary`);
  }

  getABTestingSummary(ab_test_id: any) {
    return this.http.get(`${this.URL}/cdp/ab-tests/${ab_test_id}/summary`);
  }

  getUserNotificationSummary(customer_id: any) {
    return this.http.get(`${this.URL}/cdp/notifications/customers/${customer_id}/summary`);
  }

  //Notification History (Error Detil)
  getNotificationHistoryErrorDetailByNotificationIdWithStatus(notification_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_ERROR_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/histories`, { params: { ...params, embed } });
  }

  getNotificationHistoryErrorDetailByNotificationIdAndVariantIdWithStatus(notification_id: any, variant_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_ERROR_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/variants/${variant_id}/histories`, { params: { ...params, embed } });
  }

  //Notification History (Delivered notification)
  getNotificationHistoryByNotificationIdWithStatus(notification_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_DELIVERED_NOTIFICATION;
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/histories`, { params: { ...params, embed } });
  }

  getNotificationHistoryByNotificationIdAndVariantIdWithStatus(notification_id: any, variant_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_DELIVERED_NOTIFICATION;
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/variants/${variant_id}/histories`, { params: { ...params, embed } });
  }
  //(User based notification history)Delivered detail.
  getNotificationHistoryByUserIdWithStatus(customer_id: any, params: any) {
    const { embed } = this.constantService.USER_BASE_NOTIFICATOIN_HISTORY.GET_ALL_DELIVERED_NOTIFICATION;
    return this.http.get(`${this.URL}/cdp/notifications/customers/${customer_id}/histories`, { params: { ...params, embed } });
  }
  // (User based notification history)Error notification
  getErrorNotificationHistoryByUserIdWithStatus(customer_id: any, params: any) {
    const { embed } = this.constantService.USER_BASE_NOTIFICATOIN_HISTORY.GET_ALL_ERROR_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/customers/${customer_id}/histories`, { params: { ...params, embed } });
  }

  getNotificationHistoryById(history_id: string) {
    return this.http.get(`${this.URL}/cdp/notifications/histories/${history_id}`);
  }

  updateNotificationHistoryStatus(history_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/notifications/histories/${history_id}/update-status`, data);
  }

  //(User based notification history)Queued Notification
  getNotificationQueueByUserIdWithStatus(customer_id: any, params: any) {
    const { embed } = this.constantService.USER_BASE_NOTIFICATOIN_HISTORY.GET_ALL_QUEUED_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/queues/customers/${customer_id}`, { params: { ...params, embed } });
  }
  //(User based notification history)Deferred Notification
  getDeferredNotificationByUserIdWithStatus(customer_id: any, params: any) {
    const { embed } = this.constantService.USER_BASE_NOTIFICATOIN_HISTORY.GET_ALL_DIFFERED_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/queues/customers/${customer_id}`, { params: { ...params, embed } });
  }

  //Notificatoin History (Queue Detail)
  getNotificationQueueByNotificationIdWithStatus(notification_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_QUEUED_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/queues`, { params: { ...params, embed } });
  }

  getNotificationQueueByNotificationIdAndVariantIdWithStatus(ab_test_id: any, variant_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_QUEUED_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/ab-tests/${ab_test_id}/variants/${variant_id}/queues`, { params: { ...params, embed } });
  }

  //Notification History (Differed Detail)
  getNotificationDifferedByNotificationIdWithStatus(notification_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_DIFFERED_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/queues`, { params: { ...params, embed } });
  }

  getNotificationDifferedByNotificationIdAndVariantIdWithStatus(ab_test_id: any, variant_id: any, params: any) {
    const { embed } = this.constantService.NOTIFICATION_HISTORY.GET_ALL_DIFFERED_DETAIL;
    return this.http.get(`${this.URL}/cdp/notifications/ab-tests/${ab_test_id}/variants/${variant_id}/queues`, { params: { ...params, embed } });
  }

  getNotificationQueueById(queue_id: string) {
    return this.http.get(`${this.URL}/cdp/notifications/queues/${queue_id}`);
  }

  // User Profile
  getAllUserProfile(params = {}) {
    const { embed } = this.constantService.USERPROFILE.GET_ALL;
    return this.http.get(`${this.URL}/cdp/customers`, { params: { ...params, embed } });
  }
  //?embed=(contactPointEmails,contactPointPhones,contactPointApps,contactPointAddresses,tags)
  getAllUserProfileByID(customer_id: any, params = {}) {
    return this.http.get(`${this.URL}/cdp/customers/${customer_id}`, { params });
  }

  getUserByDataSource(data_source: any, external_source_id: any, params: any) {
    return this.http.get(`${this.URL}/cdp/customers/login-details/external-source-id/${external_source_id}`);
  }

  deleteUserProfileById(customer_id: any) {
    return this.http.delete(`${this.URL}/cdp/customers/${customer_id}`);
  }

  updateUserProfileById(customer_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customers/${customer_id}`, data);
  }

  updateTagsById(customer_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customers/${customer_id}/override-tags`, data);
  }

  getUserCountByRules(data: any) {
    return this.http.post(`${this.URL}/cdp/customers/count-by-rule`, data);
  }

  //User Preference Email
  updateEmailProfileById(customer_id: any, channel_email_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customers/${customer_id}/contact-point-email/${channel_email_id}`, data);
  }

  activateEmailById(customer_id: any, channel_email_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-email/${channel_email_id}/active`, {});
  }

  inactivateEmailById(customer_id: any, channel_email_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-email/${channel_email_id}/inactive`, {});
  }

  //User Preference Phone
  updatePhoneProfileById(customer_id: any, channel_Phone_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customers/${customer_id}/contact-point-phone/${channel_Phone_id}`, data);
  }

  activatePhoneById(customer_id: any, channel_Phone_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-phone/${channel_Phone_id}/active`, {});
  }

  inactivatePhoneById(customer_id: any, channel_Phone_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-phone/${channel_Phone_id}/inactive`, {});
  }

  //User Preference App
  updateWebPushProfileById(customer_id: any, channel_web_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customers/${customer_id}/contact-point-app/${channel_web_id}`, data);
  }

  activateAppById(customer_id: any, channel_web_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-app/${channel_web_id}/active`, {});
  }

  inactivateAppById(customer_id: any, channel_web_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-app/${channel_web_id}/inactive`, {});
  }
  // Address
  updateAddressProfileById(customer_id: any, channel_web_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customers/${customer_id}/contact-point-address/${channel_web_id}`, data);
  }

  activateAddressById(customer_id: any, channel_web_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-address/${channel_web_id}/active`, {});
  }

  inactivateAddressById(customer_id: any, channel_web_id: any) {
    return this.http.patch(`${this.URL}/cdp/customers/${customer_id}/contact-point-address/${channel_web_id}/inactive`, {});
  }
  deleteDeviceByIdentifier(customer_id: any, identifier: any) {
    return this.http.delete<any>(`${this.URL}/cdp/customers/${customer_id}/contact-point-app/identifier/${encodeURIComponent(identifier)}`);
  }

  registerDevice(customer_id: any, data: any) {
    return this.http.post<any>(`${this.URL}/cdp/customers/${customer_id}/contact-point-app`, data);
  }

  //User Attribute
  getAllAttribute() {
    const { embed } = this.constantService.VIEW_ATTRIBUTE.GET_ALL_ATTRIBUTE;
    return this.http.get(`${this.URL}/cdp/customer-attributes`, { params: { embed } });
  }

  createAttribute(data: any) {
    return this.http.post(`${this.URL}/cdp/customer-attributes`, data);
  }

  getAttributeById(attribute_id: any) {
    return this.http.get(`${this.URL}/cdp/customer-attributes/${attribute_id}`);
  }

  updateAttributeById(attribute_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/customer-attributes/${attribute_id}`, data);
  }

  deleteAttributeById(attribute_id: any) {
    return this.http.delete(`${this.URL}/cdp/customer-attributes/${attribute_id}`);
  }

  //CREATE USER CHANNEL
  createUserEmailChennal(customer_id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/customers/${customer_id}/contact-point-email`, data);
  }
  createUserPhoneChennal(customer_id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/customers/${customer_id}/contact-point-phone`, data);
  }
  createUserWebChennal(customer_id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/customers/${customer_id}/contact-point-app`, data);
  }
  createUserAddresChennal(customer_id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/customers/${customer_id}/contact-point-address`, data);
  }
  //email-file-upload
  getEmailFileUpload(data: any) {
    return this.http.post(`${this.URL}/cdp/notifications/templates/email-file-upload`, data);
  }
  //get the Activate channel of the single User.#datepicker.
  getActivateChannelOfSingleUser(customer_id: any) {
    return this.http.get(`${this.URL}/cdp/customers/${customer_id}/active-channel-count`);
  }

  // error count
  getErrorHistoryCount(params = {}) {
    return this.http.get(`${this.URL}/cdp/notifications/histories/errors/summary`, { params });
  }

  getAllHistoryError(params = {}) {
    const { embed } = this.constantService.ERROR_NOTIFICATION.GET_ALL;
    return this.http.get(`${this.URL}/cdp/notifications/histories/errors`, { params: { ...params, embed } });
  }

  getAllNotificationError(params = {}) {
    return this.http.get(`${this.URL}/cdp/notifications/error`, { params });
  }

  getAllPartiallyNotificationError(params = {}) {
    return this.http.get(`${this.URL}/notification/partial-error`, { params });
  }

  getAllUsersError(params = {}) {
    return this.http.get(`${this.URL}/cdp/notifications/histories/customer-details`, { params });
  }

  // queue
  getAllQueue(params = {}) {
    const { embed } = this.constantService.QUEUE_NOTIFICATION.GET_ALL;
    return this.http.get(`${this.URL}/cdp/notifications/queues`, { params: { ...params, embed } });
  }

  getQueueCount(params = {}) {
    return this.http.get(`${this.URL}/cdp/notifications/queues/summary`, { params });
  }

  //retry error list
  errorViewList(params: any) {
    return new Observable((subscriber: any) => {
      subscriber.next(this.errorCodeList);
      subscriber.complete();
    });
  }

  // retry
  retryAllHistory(data: any) {
    return this.http.post(`${this.URL}/cdp/notifications/retry-all`, data);
  }

  retryIndividualNotifcation(data: any) {
    return this.http.post(`${this.URL}/cdp/notifications/retry-by-notifications`, data);
  }

  retryIndividualChannel(data: any) {
    return this.http.post(`${this.URL}/cdp/notifications/retry-by-histories`, data);
  }

  retryIndividualUser(data: any) {
    return this.http.post(`${this.URL}/cdp/notifications/retry-by-customers`, data);
  }

  createAttachment(template_id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/notifications/templates/${template_id}/attachments`, data);
  }

  deleteSingleAttachment(template_id: any, attachment_id: any) {
    return this.http.delete(`${this.URL}/cdp/notifications/templates/${template_id}/attachments/${attachment_id}`);
  }

  deleteMultipleAttachment(template_id: any, idList: any) {
    const params = {
      idList: JSON.stringify(idList)
    };
    return this.http.delete(`${this.URL}/cdp/notifications/templates/${template_id}/attachments`, { params: params });
  }

  downloadTemplateAttachmentById(template_id: any, attachment_id: any) {
    return this.http.get(`${this.URL}/cdp/notifications/templates/${template_id}/attachments/${attachment_id}`);
  }

  downloadNotificationAttachmentById(notification_id: any, attachment_id: any) {
    return this.http.get(`${this.URL}/cdp/notifications/${notification_id}/attachments/${attachment_id}`);
  }
  getErrorCountDetail(params = {}) {
    return this.http.get(`${this.URL}/cdp/notifications/histories/count-by-errorcode`, { params });
  }
}
