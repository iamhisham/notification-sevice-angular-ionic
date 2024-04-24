import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationUiService } from '../services/notification-ui.service';
import { AESEncryptDecryptServiceService } from '../services/aes-encrypt-decrypt-service.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})

export class LoginComponent implements OnInit {
  user: any = {};
  state: string = '';
  showVerificationCodeView = false;
  ischeckedcode: boolean = false;

  @ViewChild('showpassword') passwordInput!: any;

  constructor(public router: Router, private actRouter: ActivatedRoute,
    public notifiService: NotificationUiService,
    private AESEncryptDecryptService: AESEncryptDecryptServiceService) { }

  ngOnInit() { }

  login() {
    try {
      if (!this.user.email) throw { message: "Please enter email address" };
      if (!this.user.password) throw { message: "Please enter password" };
      this.notifiService.showLoader();
      var loginRequestPayload: any = {
        email: this.user.email,
        password: this.AESEncryptDecryptService.encrypt(this.user.password)
      };
      this.notifiService.login(loginRequestPayload).subscribe({
        next: async (details: any) => {
          this.notifiService.setTokenToCookie(details);
          if (details.newPasswordRequired) {
            this.notifiService.setSessionData(details.session);
            this.notifiService.hideLoader();
            this.router.navigate(['/create-password']);
          } else {
            this.notifiService.hideLoader();
            await this.notifiService.storage.set('username', details.name);
            this.router.navigateByUrl(this.state || '/home');
            location.href = this.state || '/home';
          }

        },
        error: async (err: any) => {
          delete this.user.password;
          this.notifiService.hideLoader();
          await this.notifiService.deleteLoginDetails();
          err = err.error?.error || err.error || err;
          if (err.CUSTOM_ERROR_CODE == 1001) {
            this.notifiService.toster.error("The user's confirmation is pending. Please provide the confirmation code that was sent via email.");
            this.showVerificationCodeView = true;
            this.notifiService.resendConfirmation(this.user).subscribe(
              {
                next: (details: any) => {
                  this.notifiService.hideLoader();
                },
                error: (err: any) => {
                  this.notifiService.hideLoader();
                  err = err.error?.error || err.error || err;
                  this.notifiService.toster.error(err.message || 'User registration failed');
                }
              }
            );
          } else {
            this.notifiService.toster.error(err.message || 'Failed');
          }
          // err.CUSTOM_ERROR_CODE == 1001 ? this.showVerificationCodeView = true : this.notifiService.toster.error(err.message || 'Failed');
        }
      });
    } catch (err: any) {
      this.notifiService.hideLoader();
      this.notifiService.toster.error(err.message || err);
    }
  }

  showPasswordtoggle(status: any) {
    if (status == 'keyUp')
      this.passwordInput.type = 'password';
    this.passwordInput.type = status == 'leave' ? 'text' : 'password';
  }

  emailConfirmationCode() {
    try {
      if (!this.user.confirmationCode) throw "Please enter confirmation code";
      var SignUpRequestPayload: any = {
        email: this.user.email,
        confirmationCode: this.user.confirmationCode
      };
      this.notifiService.showLoader();
      this.notifiService.confirmRegistration(SignUpRequestPayload).subscribe(
        {
          next: (details: any) => {
            this.notifiService.hideLoader();
            this.ischeckedcode = true;//succes checkbox
            this.showVerificationCodeView = false;
            this.notifiService.toster.success('Email confirmed successfully');
            setTimeout((delay: any) => {
              this.router.navigateByUrl('/login');
            }, 1000)
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'User registration failed');
          }
        }
      )
    }
    catch (err: any) {
      this.notifiService.toster.error(err.message || err);
      this.notifiService.hideLoader();
    }
  }
  resendConfirmationCode() {
    try {
      this.notifiService.showLoader();
      this.notifiService.resendConfirmation({ email: this.user.email }).subscribe(
        {
          next: (data: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success('Code has been Sent Successfully');
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'Failed');
          }
        }
      )
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
      this.notifiService.hideLoader();
    }
  }
}
