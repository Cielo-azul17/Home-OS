import { Injectable, computed, inject, signal } from '@angular/core';
import { HomeStore } from './home-store';

export type OnboardingStep = 'welcome' | 'add-room' | 'upload-bills' | 'explore' | 'complete';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private store = inject(HomeStore);

  private currentStep = signal<OnboardingStep>('welcome');
  private isCompleted = signal(false);

  readonly step = computed(() => this.currentStep());
  readonly completed = computed(() => this.isCompleted());

  readonly shouldShowOnboarding = computed(() => {
    // Show onboarding modal until user completes it
    return !this.isCompleted();
  });

  nextStep(step: OnboardingStep) {
    this.currentStep.set(step);
  }

  complete() {
    this.isCompleted.set(true);
    this.currentStep.set('complete');
  }

  reset() {
    this.currentStep.set('welcome');
    this.isCompleted.set(false);
  }
}
