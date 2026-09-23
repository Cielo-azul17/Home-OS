import { Component, input } from '@angular/core';
import { IconName } from '../../core/models';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  `,
})
export class Icon {
  name = input.required<IconName>();
  size = input(20);
}
