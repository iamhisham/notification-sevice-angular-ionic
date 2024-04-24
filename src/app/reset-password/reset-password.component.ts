import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AESEncryptDecryptServiceService } from '../services/aes-encrypt-decrypt-service.service';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {

  user: any = {};
  showVerificationCodeView: boolean = false;
  ischeckedcode: boolean = false;
  showConfirmationCodeView: boolean = false;
  @ViewChild('showpassword') passwordInput!: any;
  constructor(public notifiService: NotificationUiService,
    private AESEncryptDecryptService: AESEncryptDecryptServiceService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  validateEmail(isResendPwdFlow: any) {
    try {
      if (!this.user.email) throw "Please enter email address";
      this.notifiService.showLoader();
      this.notifiService.resetPassword({ email: this.user.email }).subscribe({
        next: (data: any) => {
          this.notifiService.hideLoader();
          this.showVerificationCodeView = true;
          this.notifiService.toster.success(isResendPwdFlow ? 'Verification code resent successfully' : 'Code sent successfully');
        },
        error: (err: any) => {
          err = err.error?.error || err.error || err;
          if (err.CUSTOM_ERROR_CODE == 1001) {
            this.notifiService.toster.error("The user's confirmation is pending. Please provide the confirmation code that was sent via email.");
            this.showConfirmationCodeView = true;
          } else {
            this.notifiService.toster.error(err.message || 'Failed');
          }
          this.notifiService.hideLoader();
        }
      })
    } catch (err: any) {
      this.notifiService.hideLoader();
      this.notifiService.toster.error(err.message || err);
    }

  }

  resetPassword() {
    try {
      if (!this.user.confirmationCode) throw "Please enter confirmation code";
      if (!this.user.password) throw "Please enter password";
      if (!this.user.confirmPassword) throw "Please enter confirm password";
      if (this.user.password != this.user.confirmPassword) throw "Password not matched";


      var loginRequestPayload: any = {
        confirmationCode: this.user.confirmationCode,
        password: this.AESEncryptDecryptService.encrypt(this.user.password),
        username: this.user.username
      };
      this.notifiService.showLoader();
      this.notifiService.confirmForgotPassword(loginRequestPayload).subscribe({
        next: (data: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success('Password got reset successfully');
          this.router.navigateByUrl('/login');
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message || 'Failed');
        }
      })
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
      if (!this.user.signUpconfirmationCode) throw "Please enter confirmation code";
      var SignUpRequestPayload: any = {
        email: this.user.email,
        confirmationCode: this.user.signUpconfirmationCode
      };
      this.notifiService.showLoader();
      this.notifiService.confirmRegistration(SignUpRequestPayload).subscribe(
        {
          next: (details: any) => {
            this.notifiService.hideLoader();
            this.ischeckedcode = true;//succes checkbox
            this.validateEmail(false);
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
