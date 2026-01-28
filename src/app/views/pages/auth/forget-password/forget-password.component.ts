import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {
  resetPasswordFormGroup!: FormGroup;
  isSubmitted: boolean = false;
  newPasswordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _auth: AuthService,
    private _toast: HotToastService,
    private _router: Router
  ) { }

  initResetPasswordForm() {
    this.resetPasswordFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    this.isSubmitted = true;

    if (this.resetPasswordFormGroup.invalid) return;

    // Real reset password implementation that calls the API
    // Use the direct method which updates all user fields to ensure password is properly set
    this._auth.resetPasswordDirect(this.resetPasswordForm.email.value, this.resetPasswordForm.newPassword.value).pipe(
      this._toast.observe(
        {
          loading: 'Updating password...',
          success: 'Password updated successfully! Please log in with your new password.',
          error: ({ error }) => `Error: ${error?.message || 'Failed to update password. Try again.'}`
        }
      )
    ).subscribe(
      () => {
        // Password update successful - redirect to login
        this._router.navigate(['/auth/login']);
      },
      (error) => {
        console.error('Password reset error:', error);
        // Handle error appropriately
        this._toast.error(error?.message || error?.error?.message || 'Failed to update password. Please try again.');
      }
    );
  }

  get resetPasswordForm() {
    return this.resetPasswordFormGroup.controls;
  }

  toggleNewPasswordVisibility() {
    this.newPasswordVisible = !this.newPasswordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  ngOnInit(): void {
    this.initResetPasswordForm();
  }
}