import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { SegmentViewPopupComponent } from 'src/app/segment-view-popup/segment-view-popup.component';
import { NotificationUiService } from 'src/app/services/notification-ui.service';

@Component({
  selector: 'app-user-segment-create',
  templateUrl: './user-segment-create.component.html',
  styleUrls: ['./user-segment-create.component.scss'],
})
export class UserSegmentCreateComponent implements OnInit {

  myForm!: FormGroup;
  userSegment: any = {
    rules: [
    ]
  };
  userSegmentId: any;
  userCount: any = null;
  showInitialView: boolean = false;
  userSegmentDetails: any = [
    { attr: 'all_users', name: 'All User', type: 'all_users', description: 'All Users' },
    { attr: 'age', name: 'Age', type: 'number', description: 'User Age' },
    { attr: 'gender', name: 'Gender', type: 'enum', description: 'User Gender' },
    { attr: 'language', name: 'Language', type: 'text', description: 'User Language' },
    { attr: 'role', name: 'Role', type: 'enum', description: 'User role' },
    { attr: 'best_time_contact_timezone', name: 'Time Zone', type: 'text', description: 'User Time Zone' },
    { attr: 'platform', name: 'Platform', type: 'enum', description: 'User Platform' },
    { attr: 'device_model', name: 'Device Model', type: 'text', description: 'User Device Model' },
    { attr: 'device_make', name: 'Device Make', type: 'text', description: 'User Device Make' },
    { attr: 'device_os', name: 'Device OS', type: 'text', description: 'User Device OS' },
    { attr: 'tags', name: 'Tags', type: 'tag', description: 'User Tags' }
  ];
  possibleEnumValue: any = {
    gender: [
      { name: "Male", value: "MALE" },
      { name: "Female", value: "FEMALE" }
    ],
    platform: [
      { name: "Android", value: "ANDROID" },
      { name: "IOS", value: "IOS" }
    ],
    role: [
      { name: "Admin", value: "ADMIN" },
      { name: "User", value: "USER" }
    ]
  };

  addFltr: boolean = true;
  orFltr: boolean = false;
  listOfTags: any; //attribut tags list
  isEditView: boolean = false;
  isCloneView: boolean = false;
  showAddFilterIndex: number = -1;
  showUserloader: boolean = false;

  constructor(private notifiService: NotificationUiService, private actRouter: ActivatedRoute, private router: Router, private modalController: ModalController) { }

  isInitTriggered: boolean = false;
  ngOnInit() {
    this.init();
    this.getAllAttribute();
  }

  ionViewWillEnter() {
    this.init();
  }

  ionViewWillLeave() {
    this.notifiService.closeAllAlertCtrl();
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.validateForm();
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.userSegmentId = JSON.parse(param['get']('user_segment_id'));
      if (!this.userSegmentId) {
        this.userSegmentId = JSON.parse(param['get']('clone_user_segment_id'));
        if (this.userSegmentId) this.isCloneView = true;
      }
      if (this.userSegmentId != null) {
        if (!this.isCloneView) this.isEditView = true;
        this.getUserSegmentById(this.userSegmentId);
      } else this.showInitialView = true;
    })
  }

  getUserSegmentById(userSegmentId: any) {
    this.notifiService.showLoader();
    this.notifiService.getUserSegmentById(userSegmentId).subscribe({
      next: (userSegment: any) => {
        this.showInitialView = true;
        this.notifiService.hideLoader();
        if (this.isCloneView) this.notifiService.cleanClonedObject(userSegment, 'userSegment');
        this.userSegment = userSegment;
        this.getUserCountByRule();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error?.error || err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  // save action
  onSave() {
    try {
      if (!this.userSegment.name || this.userSegment.name.split(' ').join('').length == 0) throw "Please enter Name";
      for (let obj of this.userSegment.rules) {
        for (let data of obj) {
          if (data.attr === 'age' && ((data.cond == 'BETWEEN' && data.end_value < 0 && data.start_value < 0) || (data.cond != 'BETWEEN' && data.value < 0))) throw "Age should be positive"
        }
      }
      this.isValidUserSegmentRule(this.userSegment);
      if (this.isEditView) {
        this.notifiService.updateUserSegmentById(this.userSegmentId, this.userSegment).subscribe({
          next: (e: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success('User Segment Updated Successfully!');
            this.router.navigate(['/configuration/user-segment']);
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'User Segment Update Failed');
          }
        });
      } else {
        this.notifiService.createUserSegment(this.userSegment).subscribe({
          next: (e: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success('User Segment Created Successfully!');
            this.router.navigate(['/configuration/user-segment']);
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error?.error || err.error || err;
            this.notifiService.toster.error(err.message || 'User Segment Create Failed');
          }
        })
      }
    } catch (e) {
      this.notifiService.toster.error(e);
    }
  }



  //onCancel popup
  async onCancel() {
    this.notifiService.showCancelConfirmation(['/configuration/user-segment']);
  }


  // logics for and and or conditions -------------------------

  addAndCondition(data: any) {
    var obj = { name: data.name, attr: data.attr, type: data.type }
    if (this.showAddFilterIndex == -1) {
      this.userSegment.rules.push([obj]);
    } else {
      this.userSegment.rules[this.showAddFilterIndex].push(obj);
      this.showAddFilterIndex = -1;
    }
    this.getUserCountByRule();
  }

  addFilter(parentIndex: number) {
    this.addFltr = true;
    this.orFltr = false;
    if (this.showAddFilterIndex != -1) {
      if (this.userSegment.rules[this.showAddFilterIndex].length == 0) {
        this.userSegment.rules.splice(this.showAddFilterIndex, 1);
      }
    }
    this.showAddFilterIndex = parentIndex;
  }

  addOrCond() {
    this.orFltr = true;
    this.addFltr = false;
    this.userSegment.rules.push([]);
    this.showAddFilterIndex = this.userSegment.rules.length - 1;
  }

  removeAndCondition(parIndex: any, currIndex: any) {
    this.userSegment.rules[parIndex].splice(currIndex, 1);
    if (this.userSegment.rules[parIndex].length == 0) {
      if (this.showAddFilterIndex != -1 && parIndex != this.showAddFilterIndex
        && this.userSegment.rules[this.showAddFilterIndex].length == 0) {
        this.userSegment.rules.splice(this.showAddFilterIndex, 1);
      }
      this.userSegment.rules.splice(parIndex, 1);
      this.showAddFilterIndex = -1;
    }
    this.getUserCountByRule();
    //
    this.userCount = 0;
  }

  removeCardContainer(parIndex: number) {
    if (this.userSegment.rules[parIndex].length == 0) {
      this.userSegment.rules.splice(parIndex, 1);
    }
    this.showAddFilterIndex = -1;
  }

  // validation process***

  validateForm() {
    this.myForm = new FormGroup({
      name: new FormControl(this.userSegment.name, [Validators.required,
      this.noWhitespaceValidator1,
      ]),
      age: new FormControl(this.userSegment.age, {
        validators: [Validators.min(0)]
      }),
      ageStart: new FormControl(this.userSegment.age, {
        validators: [Validators.min(0)]
      }),
      ageEnd: new FormControl(this.userSegment.age, {
        validators: [Validators.min(0)]
      })
    });
  }
  noWhitespaceValidator1(control: FormControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }
  isValidUserSegmentRule(userSegment: any) {
    if (userSegment.rules.length > 0) {
      userSegment.rules.forEach((rule: any) => {
        if (rule.length > 0) {
          rule.forEach((obj: any) => {
            switch (obj.type) {
              case "text":
              case "enum":
                if (!obj.cond) throw "Please select condition for the rule. Attribute Name = " + obj.name;
                if (!obj.value) throw "Please enter value for the rule. Attribute Name = " + obj.name;
                break;

              case "tag":
                if (!obj.field) throw "Please select field for the rule. Attribute Name = " + obj.name;
                if (!obj.cond) throw "Please select condition for the rule. Attribute Name = " + obj.name;
                if (obj.cond == 'BETWEEN') {
                  if (!obj.start_value) throw "Please select start value for the rule. Tag Name = " + obj.name;
                  if (!obj.end_value) throw "Please select end value for the rule. Tag Name = " + obj.name;
                } else if (!(obj.cond == 'EXISTS' || obj.value || obj.value !== null)) throw "Please enter value for the rule. Attribute Name = " + obj.name;
                break;

              case "number":
                if (obj.cond == 'BETWEEN') {
                  if ((!obj.start_value) && (typeof (obj.start_value) != 'number')) throw "Please select start value for the rule. Attribute Name = " + obj.name;
                  if ((!obj.end_value) && (typeof (obj.end_value) != 'number')) throw "Please select end value for the rule. Attribute Name = " + obj.name;
                } else {
                  if (!obj.cond) throw "Please select condition for the rule. Attribute Name = " + obj.name;
                  if ((!obj.value) && (typeof (obj.value) != 'number')) throw "Please enter value for the rule. Attribute Name = " + obj.name;
                }
                break;

              case "all_users":
                break;

              default: throw "Invalid Type";
            }
          });
        } else throw "Please select rule for OR condition";
      });
    } else throw "Please select rule";
    return true;
  }

  getUserCountByRule() {
    try {
      this.showUserloader = true;
      this.isValidUserSegmentRule(this.userSegment);
      this.userCount = null;
      this.notifiService.getUserCountByRules(this.userSegment).subscribe({
        next: (data: any) => {
          this.userCount = data.customerCount;
          this.showUserloader = false;
        },
        error: (err: any) => {
          err = err.error?.error || err.error || err;
          this.notifiService.toster.error(err.message);
          this.showUserloader = false;
        }
      });
    } catch (e) { }
  }

  // get all attributes for tags dropdown
  getAllAttribute() {
    this.notifiService.getAllAttribute().subscribe({
      next: (data: any) => {
        this.listOfTags = data.data;
      },
      error: (err: any) => {
        err = err.error?.error || err.error || err;
      }
    });
  }

  updateFieldType(data?: any) {
    data.field_type = this.listOfTags.find(item => item.name === data.field).type;
  }
  formatDate(date) {
    this.notifiService.dateFormat(date);
  }

  async openSegmentViewPopup() {
    const modal = await this.modalController.create({
      component: SegmentViewPopupComponent,
      cssClass: 'view-user',
      componentProps: {
        usersegementRules: this.userSegment.rules,
        userName: this.userSegment.name
      },
      backdropDismiss: false
    });
    await modal.present();
  }
}
