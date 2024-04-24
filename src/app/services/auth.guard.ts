import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationUiService } from './notification-ui.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private notifiService: NotificationUiService, private router: Router) {

  }
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.notifiService.hasToken()) {
      this.router.navigate(['/authorize'], { queryParams: { state: state.url } });
      return false;
    } else if (!this.notifiService.hasValidToken()) {
      var isSuccessfullyRenewed = await this.notifiService.renewTokenAndUpdateCookie();
      if (!isSuccessfullyRenewed) {
        this.router.navigate(['/authorize'], { queryParams: { state: state.url } });
        return false;
      }
    }
    return true;
  }

}
