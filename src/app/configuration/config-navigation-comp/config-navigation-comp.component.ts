import { Component, Input, OnInit } from '@angular/core';
import { NotificationUiService } from 'src/app/services/notification-ui.service';

@Component({
  selector: 'app-config-navigation-comp',
  templateUrl: './config-navigation-comp.component.html',
  styleUrls: ['./config-navigation-comp.component.scss'],
})
export class ConfigNavigationCompComponent implements OnInit {
  @Input() activeMenu: string = '';
  
  constructor(public notifiService: NotificationUiService) {}

  ngOnInit() {}
}
