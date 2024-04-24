/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, HostListener, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationUiService } from './services/notification-ui.service';
import { PushNotificationService } from './services/push-notification.service';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';
import { AlertController, IonRouterOutlet, NavController, Platform } from '@ionic/angular';
import { AuthGuard } from './services/auth.guard';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  urlList: any = ['/login', '/signup', '/authorize', '/logout', '/reset-password'];
  isMenuCollapse = true;
  menuList = [
    {
      title: 'Dashboard',
      image: 'logo-apple-ar',
      link: 'dashboard',
    },
    {
      title: 'Configuration',
      image: 'options-outline',
      link: 'configuration',
    },
    {
      title: 'Notification',
      image: 'notifications-outline',
      link: 'notification',
    },
    {
      title: 'A/B testing',
      image: 'flask-outline',
      link: 'ab-testing',
    },
    // {
    //   title: 'User Profile',
    //   image: 'person-outline',
    //   link: 'user-profile',
    // },
    {
      title: 'Queue',
      image: 'albums-outline',
      link: 'queue/notification',
    },
    {
      title: 'Error',
      image: 'bug-outline',
      link: 'error/notification',
    }
  ];

  customPopoverOptions: any = {
    cssClass: 'popover-wide',
  };
  logInPageURL = '/login';
  @Optional() private routerOutlet!: IonRouterOutlet
  private readonly canGoBack: any;
  constructor(public route: Router,
    public notifiService: NotificationUiService,
    private pushNotificationService: PushNotificationService,
    private _location: Location,
    private alertController: AlertController,
    private platform: Platform,
    public navCtrl: NavController,
    private router: Router,
  ) {
    // let canGoBack = this.routerOutlet.canGoBack();
    const url = this.route.url;
    this.canGoBack = !!(this.router.getCurrentNavigation()?.previousNavigation);


    App.addListener('backButton', (event) => {
      if (this._location.isCurrentPathEqualTo('/configuration/category') && !event.canGoBack) {
        this.exitConfirmation()
      }
      else {
        this._location.back();
      }
    });
  }

  ngOnInit() {
    // alert(this.notifiService.userDetails.name.charAt(0))
  }


  async exitConfirmation() {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Want to exit',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => { navigator['app'].exitApp() }
        },
      ],
    });
    await alert.present();
  }

  async logOutConformation() {
    const alert = await this.alertController.create({
      header: 'Log Out',
      subHeader: 'You will be returned to the login screen.',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
        {
          text: 'Logout',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => {
            this.notifiService.deleteLoginDetails();

            this.router.navigate(['/logout']);
          }
        },
      ],
    });
    await alert.present();
  }

}
