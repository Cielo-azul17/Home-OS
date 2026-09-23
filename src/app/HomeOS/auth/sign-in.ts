import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../shared/icon/icon';
import { Supabase } from '../core/backend/supabase-client';

/* Shown instead of the app when a Supabase project is configured and nobody
   is signed in. Deliberately plain — it's a door, not a landing page. */

@Component({
  selector: 'app-sign-in',
  imports: [Icon, FormsModule],
  template: `
    <div class="screen">
      <form class="card" (submit)="submit($event)">
        <div class="brand">
          <app-icon name="home" [size]="22" />
          <span>HomeOS</span>
        </div>

        <h1>{{ creating() ? 'Create your home' : 'Welcome back' }}</h1>
        <p class="lede">
          {{
            creating()
              ? 'One account holds one home — its rooms, its things and its paperwork.'
              : 'Sign in to pick up where you left off.'
          }}
        </p>

        @if (sent()) {
          <div class="notice">
            <app-icon name="check-circle" [size]="16" />
            <span>Check your email to confirm the account, then sign in.</span>
          </div>
        }

        <div class="field">
          <label class="field-label" for="auth-email">Email</label>
          <input
            id="auth-email"
            class="input"
            type="email"
            autocomplete="email"
            [(ngModel)]="email"
            name="email"
            placeholder="you@example.com"
          />
        </div>

        <div class="field">
          <label class="field-label" for="auth-password">Password</label>
          <input
            id="auth-password"
            class="input"
            type="password"
            [attr.autocomplete]="creating() ? 'new-password' : 'current-password'"
            [(ngModel)]="password"
            name="password"
            placeholder="At least 6 characters"
          />
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" class="btn btn-primary btn-block" [disabled]="!canSubmit()">
          {{ busy() ? 'One moment…' : creating() ? 'Create account' : 'Sign in' }}
        </button>

        <p class="switch">
          {{ creating() ? 'Already have an account?' : 'New here?' }}
          <button type="button" class="link" (click)="toggle()">
            {{ creating() ? 'Sign in' : 'Create one' }}
          </button>
        </p>
      </form>
    </div>
  `,
  styles: `
    .screen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--spacing-24);
      background: var(--color-eggshell);
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-16);
      width: 100%;
      max-width: 380px;
      padding: var(--spacing-32);
      background: var(--color-surface);
      border: 1px solid var(--color-soft-stone);
      border-radius: var(--radius-large-card);
      box-shadow: var(--shadow-subtle);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-12);
      color: var(--color-sage);
      font-size: var(--text-body);
      font-weight: 500;
      margin-bottom: var(--spacing-8);
    }

    h1 {
      font-size: var(--text-subheading);
      font-weight: 500;
      line-height: 1.3;
      color: var(--color-charcoal);
    }

    .lede {
      margin-top: calc(var(--spacing-12) * -1);
      font-size: var(--text-body-sm);
      line-height: 1.5;
      color: var(--color-smoke);
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-8);
      padding: var(--spacing-12);
      border-radius: var(--radius-input);
      background: var(--color-sage-soft);
      color: var(--color-sage);
      font-size: var(--text-caption);
      line-height: 1.4;
    }

    .error {
      font-size: var(--text-caption);
      line-height: 1.4;
      color: var(--color-error);
    }

    .switch {
      text-align: center;
      font-size: var(--text-caption);
      color: var(--color-smoke);
    }

    .link {
      background: none;
      border: none;
      padding: 0;
      font-size: var(--text-caption);
      color: var(--color-sage);
    }

    .link:hover {
      text-decoration: underline;
    }
  `,
})
export class SignIn {
  private supabase = inject(Supabase);

  email = '';
  password = '';

  creating = signal(false);
  busy = signal(false);
  error = signal('');
  sent = signal(false);

  readonly canSubmit = computed(() => !this.busy());

  toggle(): void {
    this.creating.update((value) => !value);
    this.error.set('');
    this.sent.set(false);
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;

    const email = this.email.trim();
    if (!email || this.password.length < 6) {
      this.error.set('Enter your email and a password of at least 6 characters.');
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.sent.set(false);

    try {
      if (this.creating()) {
        const { needsConfirmation } = await this.supabase.signUp(email, this.password);
        // With confirmations on there's no session yet, so say what happens next.
        if (needsConfirmation) {
          this.sent.set(true);
          this.creating.set(false);
        }
      } else {
        await this.supabase.signIn(email, this.password);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      this.busy.set(false);
    }
  }
}
