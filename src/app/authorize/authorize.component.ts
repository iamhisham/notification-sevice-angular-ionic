import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-authorize',
  templateUrl: './authorize.component.html',
  styleUrls: ['./authorize.component.scss'],
})
export class AuthorizeComponent implements OnInit {

  constructor(private router: Router, private actRouter: ActivatedRoute, public notifiService: NotificationUiService) {
    this.actRouter.queryParams.subscribe((param: Params) => {
      const state = param['state'];
      if (this.notifiService.hasToken()) {
        this.router.navigateByUrl(state || '/home');
      } else if (state) {
        this.router.navigate(['/login'], { queryParams: { state } });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit() { }

}
