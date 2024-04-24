import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { environment } from '../../environments/environment';


import { AngularFireMessaging } from '@angular/fire/compat/messaging';

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { onBackgroundMessage } from 'firebase/messaging/sw';
import { getId, getInstallations } from 'firebase/installations';

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';

import {
  ActionPerformed as LocalNotificationsActionPerformed,
  LocalNotificationSchema,
  LocalNotifications
} from '@capacitor/local-notifications';


import { NotificationUiService } from 'src/app/services/notification-ui.service';
import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  localNotificationId: number = 0;
  isRegistered: boolean = false;
  user_id: string = '';
  identifier: string = '';

  tokenError: any = null;

  isMobilePlatform: boolean = Capacitor.getPlatform() !== 'web';
  deviceInfo: any;

  message: any;

  constructor(private notifiService: NotificationUiService, private afMessaging: AngularFireMessaging) {

    if (!environment.production && location.search.indexOf('webpack-dev-server-live-reload=false') == -1) {
      location.search = '?webpack-dev-server-live-reload=false' + (location.search ? '&' + location.search.substring(1) : '');
    }
    if (notifiService.hasToken()) {
      this.init();
    }
  }

  async init() {
    this.isRegistered = (await this.notifiService.storage.get('IS-REGISTERED')) == 'true';
    this.user_id = this.isRegistered ? (await this.notifiService.storage.get('REGISTERED-USER-ID')) || '' : '';
    this.identifier = this.isRegistered ? (await this.notifiService.storage.get('REGISTERED-IDENTIFIER')) || '' : '';
    this.deviceInfo = await Device.getInfo();
    if (this.isMobilePlatform) {
      await this.registerMobilePush();
    } else {
      this.registerAndListenWebPush();
    }
  }

  async resetDeviceRegistration() {
    this.isRegistered = false;
    await this.notifiService.storage.remove('IS-REGISTERED');
    await this.notifiService.storage.remove('REGISTERED-USER-ID');
    await this.notifiService.storage.remove('REGISTERED-IDENTIFIER');
    await this.notifiService.storage.remove('REGISTERED-ID');
  }

  private getBrowserName() {
    let userAgent = navigator.userAgent;
    if (userAgent.match(/edg/i)) return 'EDGE';
    else if (userAgent.match(/opr\//i)) return 'OPERA';
    else if (userAgent.match(/chrome|chromium|crios/i)) return 'CHROME';
    else if (userAgent.match(/firefox|fxios/i)) return 'FIREFOX';
    else if (userAgent.match(/safari/i)) return 'SAFARI';
    else throw 'No Broser Found';
  }

  async registerMobileDeviceWithUserId(user_id: any) {
    if (!this.isMobilePlatform) throw { message: 'Mobile notification doesn\'t support in this device' };
    if (!user_id) throw { message: 'UserId is Mandatory' };
    this.user_id = user_id;
    if (this.identifier) {
      await this.registerMobileDevice(this.identifier);
    } else {
      throw this.tokenError || { message: 'Token not generated' };
    }
  }

  async getUserId() {
    return await this.notifiService.storage.get('REGISTERED-USER-ID') || '';
  }

  async registerWebDeviceWithUserId(user_id: any) {
    if (this.isMobilePlatform) throw { message: 'Web notification doesn\'t support in this device' };
    if (!user_id) throw { message: 'UserId is Mandatory' };
    this.user_id = user_id;
    if (this.identifier) {
      await this.registerWebDevice(this.identifier);
    } else {
      throw this.tokenError || { message: 'Token not generated' };
    }
  }

  private async registerMobileDevice(token: string) {
    await this.registerWebOrMobileDevice(token);
  }

  private async registerWebDevice(token: string) {
    await this.registerWebOrMobileDevice(token);
  }

  private async registerWebOrMobileDevice(token: string) {
    var existingIdentifier = this.identifier;

    this.identifier = token;

    if (this.isRegistered) {
      if (existingIdentifier != token) {
        await this.deleteDevice(existingIdentifier);
        this.user_id = this.notifiService.userDetails.id;
        await this.registerDevice();
        console.log('Device Re-registered with userId = ' + this.user_id + ' and token = ' + token);
      } if (this.user_id != this.notifiService.userDetails.id) {
        await this.deleteDevice(existingIdentifier);
        this.user_id = this.notifiService.userDetails.id;
        await this.registerDevice();
        console.log('Device Re-registered with userId = ' + this.user_id + ' and token = ' + token);
      } else {
        console.log('Device already Registered with userId = ' + this.user_id + ' and token = ' + token);
      }
    } else if (this.notifiService.userDetails.id) {
      this.user_id = this.notifiService.userDetails.id;
      await this.registerDevice();
      console.log('Device Registered with userId = ' + this.user_id + ' and token = ' + token);
    }
  }

  private async getDeviceDetails() {
    const randomNumber = uuidv4();
    const deviceDetails: any = {
      identifier: this.identifier,
      language: (await Device.getLanguageCode()).value,
      data_source: 'Notificaion Admin Portal',
      device_model: this.deviceInfo.model,
      device_os: this.deviceInfo.operatingSystem,
      external_source_id: randomNumber,
    };
    if (this.isMobilePlatform) {
      deviceDetails.channel = 'MOBILE';
      deviceDetails.platform = this.deviceInfo.platform.toUpperCase();
    } else {
      deviceDetails.channel = 'WEB';
      deviceDetails.browser_type = this.getBrowserName();
    }
    return deviceDetails;
  }

  private async registerDevice() {
    try {
      const deviceDetails: any = await this.getDeviceDetails();
      console.log('Device Registration Started', deviceDetails);
      const device: any = await this.notifiService.registerDevice(this.user_id, deviceDetails).toPromise();
      console.log('Device Registration Success. Device Id = ' + device.id);
      this.isRegistered = true;
      await this.notifiService.storage.set('IS-REGISTERED', 'true');
      await this.notifiService.storage.set('REGISTERED-USER-ID', this.user_id);
      await this.notifiService.storage.set('REGISTERED-IDENTIFIER', deviceDetails.identifier);
      await this.notifiService.storage.set('REGISTERED-ID', device.id);
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      console.error('Device Registration Failed', err);
      // this.notifiService.toster.error(err.message || 'Device Registration Failed');
    }
  }

  private async deleteDevice(identifier: string) {
    try {
      console.log('Delete Device Started. Identifier = ' + identifier);
      await this.notifiService.deleteDeviceByIdentifier(this.user_id, identifier).toPromise();
      console.log('Device Deleted Successfully');
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      console.error('Failed to Delete Device', err);
      // this.notifiService.toster.error(err.message || 'Delete Device Failed');
    }
    await this.resetDeviceRegistration();
  }

  private async registerMobilePush() {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') {
        throw new Error('User denied push notification permissions!');
      }
      await this.listenMobilePushMessaging();
      await PushNotifications.register();
      await this.listenMobileLocalPushMessaging();
    } catch (err: any) {
      err = err.error?.error || err.error || err;
      console.error('Register Mobile Push Failed', err);
      // this.notifiService.toster.error(err.message || 'Register Mobile Push Failed');
    }
  }

  private async listenMobilePushMessaging() {
    try {
      const deliverdNotification = await PushNotifications.getDeliveredNotifications();
      if (deliverdNotification != null) {
        console.log("deliverdNotification = ", deliverdNotification);
      }
      // await PushNotifications.removeAllListeners();
      await PushNotifications.addListener('registration', (token: Token) => {
        this.tokenError = null;
        this.registerMobileDevice(token.value);
      });

      await PushNotifications.addListener('registrationError', (err: any) => {
        this.tokenError = err.error;
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        var data = notification.data || {};
        console.log("Notification Received", notification);
        if (data.id && data.ref_id) {
          LocalNotifications.schedule({
            notifications: [{
              title: notification.title || "",
              body: notification.body || "",
              id: ++this.localNotificationId,
              extra: data,
              schedule: {
                at: new Date(new Date().getTime() + 1000),
                repeats: false
              }
            }]
          });
          this.updateNotificationStatus(data, 'DELIVERED');
        }
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        const { actionId, inputValue, notification } = action;
        console.log("Notification Action Performed; actionId=" + actionId + "; inputValue=" + inputValue, action);
        var data = notification.data || {};
        if (data.id && data.ref_id) {
          this.updateNotificationStatus(data, 'VIEWED');
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  private async listenMobileLocalPushMessaging() {
    try {
      await LocalNotifications.removeAllListeners();
      await LocalNotifications.addListener('localNotificationReceived', (notification: LocalNotificationSchema) => {
        console.log("Local Notification Received", notification);
      });

      await LocalNotifications.addListener('localNotificationActionPerformed', (action: LocalNotificationsActionPerformed) => {
        const { actionId, inputValue, notification } = action;
        console.log("Local Notification Action Performed; actionId=" + actionId + "; inputValue=" + inputValue, action);
        var data = notification.extra || {};
        if (data.id && data.ref_id) {
          this.updateNotificationStatus(data, 'VIEWED');
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  private registerAndListenWebPush() {
    this.registerWebPush();
    this.listenWebPushMessaging();
  }

  private registerWebPush() {
    if (Notification.permission !== 'granted') {
      this.afMessaging.requestToken.subscribe({
        next: (token: any) => {
          if (Notification.permission == 'granted') {
            this.tokenError = null;
            this.registerWebPush();
          } else {
            this.tokenError = { message: 'Notification Permission ' + Notification.permission };
            if (this.identifier) this.deleteDevice(this.identifier);
          }
        },
        error: (error: any) => {
          this.tokenError = error;
          console.error(error);
        }
      });
    } else {
      this.afMessaging.tokenChanges.subscribe({
        next: (token: any) => {
          if (Notification.permission == 'granted') {
            this.tokenError = null;
            this.registerWebDevice(token);
          } else {
            this.tokenError = { message: 'Notification Permission ' + Notification.permission };
            if (this.identifier) this.deleteDevice(this.identifier);
          }
        },
        error: (error: any) => {
          this.tokenError = error;
          console.error(error);
        }
      });
    }
  }

  listenWebPushMessaging() {
    this.afMessaging.messages.subscribe((message: any) => {
      console.log('Message received: ' + document.hidden, message);
      const { notification, data } = message;
      if (data && data.id && data.ref_id) {
        const lastNotificationId = localStorage.getItem('last-notification-id') || '';
        if (lastNotificationId != data.ref_id) {
          localStorage.setItem('last-notification-id', data.ref_id);
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(notification.title, {
              body: notification.body,
              icon: notification.icon,
              image: notification.image,
              data: message
            });
          });
          this.updateNotificationStatus(data, 'DELIVERED');
        }
      }
    });
  }
  updateNotificationStatus(data: any, status: string) {
    this.notifiService.updateNotificationHistoryStatus(data.id, {
      id: data.id,
      ref_id: data.ref_id,
      status: status
    }).subscribe({
      next: (data: any) => {
        console.log(status + ' status updated successfully');
      },
      error: (err: any) => {
        console.log(status + ' status updated failed', err);
      }
    });
  }

}
