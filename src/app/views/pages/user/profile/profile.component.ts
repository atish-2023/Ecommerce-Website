import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { UserService } from '../services/user.service';
import { HotToastService } from '@ngneat/hot-toast';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: any;
  isVisable: boolean = false;
  isChangePasswordModalVisible: boolean = false;
  editUserFormGroup!: FormGroup;
  changePasswordFormGroup!: FormGroup;
  isSubmitted: boolean = false;
  passwordSubmitted: boolean = false;
  
  // Default avatar URL - better quality and size for avatar
  defaultAvatar: string = 'https://ui-avatars.com/api/?name=U&size=120&background=0D8ABC&color=fff&rounded=true&bold=true';

  constructor(
    private _auth: AuthService,
    private _userService: UserService,
    private _formBuilder: FormBuilder,
    private _toast: HotToastService
  ) { }

  ngOnInit(): void {
    this._userService.getUser().subscribe((user) => {
      this.profile = user;
      this.initEditForm();
      this.initChangePasswordForm();
    });
  }

  initEditForm() {
    this.editUserFormGroup = this._formBuilder.group({
      name: [this.profile.name, Validators.required],
      email: [this.profile.email, [Validators.required, Validators.email]]
    });
  }

  initChangePasswordForm() {
    this.changePasswordFormGroup = this._formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
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

  openEditModal() {
    this.isVisable = true;
    // Reset form values to current profile data
    this.editUserFormGroup.patchValue({
      name: this.profile.name,
      email: this.profile.email
    });
  }

  closeEditModal() {
    this.isVisable = false;
    this.isSubmitted = false;
    this.editUserFormGroup.reset();
  }

  openChangePasswordModal() {
    this.isChangePasswordModalVisible = true;
    this.passwordSubmitted = false;
    // Reset the form when opening the modal
    this.changePasswordFormGroup.reset();
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalVisible = false;
    this.passwordSubmitted = false;
    this.changePasswordFormGroup.reset();
  }

  onSubmitEdit() {
    this.isSubmitted = true;
    if (this.editUserFormGroup.invalid) return;

    this._userService.updateUser(this.profile.id, this.editUserForm.value).pipe(
      this._toast.observe({
        loading: 'Updating profile...',
        success: 'Profile updated successfully',
        error: 'Failed to update profile'
      })
    ).subscribe(
      (updatedUser: any) => {
        this.profile = updatedUser;
        this.closeEditModal();
      }
    );
  }

  onChangePassword() {
    this.passwordSubmitted = true;
    if (this.changePasswordFormGroup.invalid) return;

    const currentPassword = this.changePasswordForm['currentPassword'].value;
    const newPassword = this.changePasswordForm['newPassword'].value;

    // First verify the current password by attempting a login
    this._auth.login(this.profile.email, currentPassword).subscribe({
      next: (loginResponse) => {
        // Login successful with current password, now update it
        // Use the updatePassword method directly
        this._auth.updatePassword(this.profile.id, newPassword).pipe(
          this._toast.observe({
            loading: 'Changing password...',
            success: 'Password changed successfully! Please log in with your new password.',
            error: ({ error }) => `Error: ${error.message || 'Failed to change password'}`
          })
        ).subscribe({
          next: () => {
            // Password changed successfully, user is automatically logged out
          },
          error: (error) => {
            console.error('Password change error:', error);
            this.passwordSubmitted = false;
          }
        });
      },
      error: (error) => {
        // Current password is incorrect
        this._toast.error('Current password is incorrect');
        this.passwordSubmitted = false;
      }
    });
  }

  get editUserForm() {
    return this.editUserFormGroup.controls;
  }

  get changePasswordForm() {
    return this.changePasswordFormGroup.controls;
  }

  // Handle image loading errors - fallback to default avatar
  handleImageError(event: any): void {
    console.log('Avatar image failed to load, using default avatar');
    event.target.src = this.defaultAvatar;
  }
}