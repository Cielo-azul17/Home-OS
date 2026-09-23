import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { StatusBadge } from '../status-badge/status-badge';
import { Truncated } from '../tooltip/truncated.directive';
import { Asset, CATEGORY_ICON } from '../../core/models';
import { HomeStore, warrantyBadge } from '../../core/home-store';

/* Design system: product image -> asset name -> room/category -> key status. */

@Component({
  selector: 'app-asset-card',
  imports: [Icon, StatusBadge, RouterLink, Truncated],
  templateUrl: './asset-card.html',
  styleUrl: './asset-card.css',
})
export class AssetCard {
  private store = inject(HomeStore);

  asset = input.required<Asset>();

  imageFailed = signal(false);

  showImage = computed(() => !!this.asset().image && !this.imageFailed());
  fallbackIcon = computed(() => CATEGORY_ICON[this.asset().category]);
  roomName = computed(() => this.store.roomName(this.asset().roomId));
  badge = computed(() => warrantyBadge(this.asset()));
}
