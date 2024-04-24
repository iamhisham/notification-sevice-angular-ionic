import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AESEncryptDecryptServiceService } from '../services/aes-encrypt-decrypt-service.service';
import { NotificationUiService } from '../services/notification-ui.service';
@Component({
  selector: 'app-new-password-create',
  templateUrl: './new-password-create.component.html',
  styleUrls: ['./new-password-create.component.scss'],
})
export class NewPasswordCreateComponent implements OnInit {
  user: any = {};
  sessionData: any;

  @ViewChild('showpassword') passwordInput!: any;
  constructor(public notificationService: NotificationUiService, private router: Router, private AESEncryptDecryptService: AESEncryptDecryptServiceService,) { }

  ngOnInit() {
    this.notificationService.sessionData$.subscribe(data => {
      this.sessionData = data;
      console.log('Session Data:', this.sessionData);
    });
  }
  CreatePassword() {
    try {
      if (!this.user.email) throw "Please enter email";
      if (!this.user.password) throw "Please enter password";
      if (!this.user.confirmPassword) throw "Please enter confirm password";
      var createPassword: any = {
        email: this.user.email,
        password: this.AESEncryptDecryptService.encrypt(this.user.conformationPassword),
        session: this.sessionData,
      };
      this.notificationService.showLoader();
      this.notificationService.createPassword(createPassword).subscribe({
        next: (data: any) => {
          this.notificationService.hideLoader();
          this.notificationService.toster.success('Password Create successfully');
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          this.notificationService.hideLoader();
          err = err.error?.error || err.error || err;
          this.notificationService.toster.error(err.message || 'Failed');
        }
      })
    } catch (e: any) {
      this.notificationService.hideLoader();
      this.notificationService.toster.error(e.error?.error?.message || e.message || e);
    }
  }
  showPasswordtoggle(status: any) {
    if (status == 'keyUp')
      this.passwordInput.type = 'password';
    this.passwordInput.type = status == 'leave' ? 'text' : 'password';
  }
}
