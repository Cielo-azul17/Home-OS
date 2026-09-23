import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-section-header',
  imports: [Icon, RouterLink],
  templateUrl: './section-header.html',
  styleUrl: './section-header.css',
})
export class SectionHeader {
  title = input.required<string>();
  actionLabel = input<string>();
  actionLink = input<string>();
  badge = input<number>();
  action = output<void>();
}
