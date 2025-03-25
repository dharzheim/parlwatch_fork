import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { IonicModule } from '@ionic/angular';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-settings-overview',
  templateUrl: './settings-overview.page.html',
  styleUrls: ['./settings-overview.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslocoDirective]
})
export class SettingsOverviewPage {
  constructor() {}

  surveyClicked() {
    Browser.open({
      url: 'https://forms.gle/pesghE51E89XnNXa7',
      presentationStyle: 'popover'
    });
  }
}
