import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private cookieService: CookieService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const XSRF_TOKEN = this.cookieService.get('XSRF-TOKEN');
    const X_XSRF_TOKEN = this.cookieService.get('X-XSRF-TOKEN');
    if (XSRF_TOKEN) {
      request = request.clone({
        setHeaders: { 
          "XSRF-TOKEN": XSRF_TOKEN,
          "X-XSRF-TOKEN": X_XSRF_TOKEN
        }
      });
    }
    return next.handle(request);
  }
}
