import { Injectable, computed, inject } from '@angular/core';
import { HomeStore } from './home-store';
import { Asset, Expense } from './models';
import { formatDate } from './format';

export interface Alert {
  id: string;
  type: 'warranty' | 'maintenance' | 'budget';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  icon: string;
  relatedId?: string;
  action?: { label: string; fn: () => void };
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private store = inject(HomeStore);

  readonly alerts = computed(() => {
    const allAlerts: Alert[] = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const assets = this.store.assets();
    const expenses = this.store.expenses();

    for (const asset of assets) {
      if (asset.warrantyExpiry) {
        const warrantyDate = new Date(asset.warrantyExpiry);
        if (warrantyDate <= thirtyDaysFromNow && warrantyDate > today) {
          const daysLeft = Math.ceil(
            (warrantyDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
          );
          allAlerts.push({
            id: `warranty-${asset.id}`,
            type: 'warranty',
            title: `${asset.name} warranty expiring`,
            message: `${asset.name}'s warranty expires in ${daysLeft} days`,
            severity: daysLeft <= 7 ? 'critical' : 'warning',
            icon: 'shield',
            relatedId: asset.id,
          });
        } else if (warrantyDate <= today) {
          allAlerts.push({
            id: `warranty-expired-${asset.id}`,
            type: 'warranty',
            title: `${asset.name} warranty expired`,
            message: `${asset.name}'s warranty expired on ${formatDate(asset.warrantyExpiry)}`,
            severity: 'info',
            icon: 'alert-triangle',
            relatedId: asset.id,
          });
        }
      }

      if (asset.history && asset.history.length > 0) {
        const lastService = asset.history[0];
        const lastServiceDate = new Date(lastService.date);
        const oneYearFromService = new Date(
          lastServiceDate.getTime() + 365 * 24 * 60 * 60 * 1000
        );

        if (oneYearFromService <= thirtyDaysFromNow && oneYearFromService > today) {
          const daysLeft = Math.ceil(
            (oneYearFromService.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
          );
          allAlerts.push({
            id: `maintenance-${asset.id}`,
            type: 'maintenance',
            title: `${asset.name} maintenance due`,
            message: `${asset.name} is due for maintenance in ${daysLeft} days (last serviced ${formatDate(lastService.date)})`,
            severity: 'warning',
            icon: 'wrench',
            relatedId: asset.id,
          });
        }
      }
    }

    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthlyExpenses = expenses.filter(
      e => new Date(e.date) >= currentMonth && new Date(e.date) < nextMonth
    );
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetThreshold = 50000;

    if (monthlyTotal > budgetThreshold * 0.9) {
      allAlerts.push({
        id: 'budget-alert',
        type: 'budget',
        title: `Monthly budget ${monthlyTotal > budgetThreshold ? 'exceeded' : 'warning'}`,
        message: `You've spent ₹${monthlyTotal.toLocaleString('en-IN')} this month (${Math.round((monthlyTotal / budgetThreshold) * 100)}% of ₹${budgetThreshold.toLocaleString('en-IN')} budget)`,
        severity: monthlyTotal > budgetThreshold ? 'critical' : 'warning',
        icon: 'wallet',
      });
    }

    return allAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  });

  readonly criticalCount = computed(() =>
    this.alerts().filter(a => a.severity === 'critical').length
  );
}
