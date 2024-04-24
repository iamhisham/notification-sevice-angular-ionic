import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { DashboardPageComponent } from './dashboard-page/dashboard-page.component';
import { NotificationPageComponent } from './notification-page/notification-page.component';
import { ConfigCategory } from './configuration/config-category/config-category';
import { ConfigCategoryCreateUpdateComponent } from './configuration/config-category/config-category-create-update/config-category-create-update';
import { ConfigTemplate } from './configuration/config-template/config-template';
import { UserSegmentComponent } from './configuration/user-segment/user-segment.component';
import { TempCreate } from './configuration/config-template/temp-create/temp-create';
import { NotificationHistoryComponent } from './notification-history/notification-history.component';
import { NotificationCreatePageComponent } from './notification-page/notification-create-page/notification-create-page.component';
import { LoginComponent } from './login/login.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserProfileviewComponent } from './user-profile/user-profileview/user-profileview.component';
import { AuthorizeComponent } from './authorize/authorize.component';
import { UserBasedNotificationHistoryComponent } from './user-based-notification-history/user-based-notification-history.component';
import { UserSegmentCreateComponent } from './configuration/user-segment/user-segment-create/user-segment-create.component';
import { LogoutComponent } from './logout/logout.component';
import { AuthGuard } from './services/auth.guard';
import { SignupComponent } from './signup/signup.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ViewAttributeComponent } from './user-profile/view-attribute/view-attribute.component';
import { AbTestingComponent } from './ab-testing/ab-testing.component';
import { AbTestingResultComponent } from './ab-testing/ab-testing-result/ab-testing-result.component';
import { ErrorViewComponent } from './error-view/error-view.component';
import { QueueViewComponent } from './queue-view/queue-view.component';
import { NewPasswordCreateComponent } from './new-password-create/new-password-create.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'authorize', component: AuthorizeComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'create-password', component: NewPasswordCreateComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [AuthGuard] },

  {
    path: 'configuration',
    children: [
      { path: '', component: ConfigCategory, canActivate: [AuthGuard] },

      { path: 'category', component: ConfigCategory, canActivate: [AuthGuard] },
      { path: 'category/create', component: ConfigCategoryCreateUpdateComponent, canActivate: [AuthGuard] },
      { path: 'category/:category_id', component: ConfigCategoryCreateUpdateComponent, canActivate: [AuthGuard] },
      { path: 'category/clone/:clone_category_id', component: ConfigCategoryCreateUpdateComponent, canActivate: [AuthGuard] },

      { path: 'template', component: ConfigTemplate, canActivate: [AuthGuard] },
      { path: 'template/create', component: TempCreate, canActivate: [AuthGuard] },
      { path: 'template/:template_id', component: TempCreate, canActivate: [AuthGuard] },
      { path: 'template/clone/:clone_template_id', component: TempCreate, canActivate: [AuthGuard] },

      { path: 'user-segment', component: UserSegmentComponent, canActivate: [AuthGuard] },
      { path: 'user-segment/create', component: UserSegmentCreateComponent, canActivate: [AuthGuard] },
      { path: 'user-segment/:user_segment_id', component: UserSegmentCreateComponent, canActivate: [AuthGuard] },
      { path: 'user-segment/clone/:clone_user_segment_id', component: UserSegmentCreateComponent, canActivate: [AuthGuard] }

    ],
    canActivate: [AuthGuard]
  },
  { path: 'notification', component: NotificationPageComponent, canActivate: [AuthGuard] },
  { path: 'notification/create', component: NotificationCreatePageComponent, canActivate: [AuthGuard] },
  { path: 'notification/:notification_id', component: NotificationCreatePageComponent, canActivate: [AuthGuard] },
  { path: 'notification/clone/:clone_notification_id', component: NotificationCreatePageComponent, canActivate: [AuthGuard] },
  { path: 'notification/:notification_id/history', component: NotificationHistoryComponent, canActivate: [AuthGuard] },

  { path: 'ab-testing', component: AbTestingComponent, canActivate: [AuthGuard] },
  { path: 'ab-testing/create', component: NotificationCreatePageComponent, canActivate: [AuthGuard] },
  { path: 'ab-testing/:notification_id', component: NotificationCreatePageComponent, canActivate: [AuthGuard] },
  { path: 'ab-testing/clone/:clone_notification_id', component: NotificationCreatePageComponent, canActivate: [AuthGuard] },
  { path: 'ab-testing/:notification_id/history/:variant_id', component: NotificationHistoryComponent, canActivate: [AuthGuard] },
  { path: 'ab-testing/result/:notification_id', component: AbTestingResultComponent, canActivate: [AuthGuard] },

  { path: 'user-profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'user-profile/view_attribute', component: ViewAttributeComponent, canActivate: [AuthGuard] },
  { path: 'user-profile/:user_profile_id', component: UserProfileviewComponent, canActivate: [AuthGuard] },
  { path: 'user-profile/:user_id/history', component: UserBasedNotificationHistoryComponent, canActivate: [AuthGuard] },

  { path: 'error/notification', component: ErrorViewComponent, canActivate: [AuthGuard] },

  { path: 'queue/notification', component: QueueViewComponent, canActivate: [AuthGuard] },

  { path: 'home', redirectTo: 'configuration/category' },
  { path: '', redirectTo: 'login', pathMatch: 'full' }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
