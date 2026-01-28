import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserDataMigrationService } from '../../../services/user-data-migration.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LocalstorageService } from '../services/localstorage.service';
import { HotToastService } from '@ngneat/hot-toast';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  passwordVisible: boolean = false
  loginFormGroup!: FormGroup;
  isSubmitted: boolean = false;
  authError: boolean = false;
  authMessage:string = 'Email or Password are wrong';

  constructor(
    private _formBuilder: FormBuilder,
    private _auth: AuthService,
    private _migrationService: UserDataMigrationService,
    private _localstorageService: LocalstorageService,
    private _toast: HotToastService,
    private _router: Router,
    private _cartService: CartService,
    private _wishlistService: WishlistService
  ) {}

  initLoginForm() {
    this.loginFormGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  onSubmit() {
    this.isSubmitted = true;

    if (this.loginFormGroup.invalid) return;

    this._auth.login(this.loginForm.email.value, this.loginForm.password.value).pipe(
      this._toast.observe(
        {
          loading: 'Logging in...',
          success: 'Logged in successfully',
          error: ({ error }) => `There was an error: ${error.message} `
        }
      ),
      ).subscribe(
      (user) => {
        this.authError = false;
        this._localstorageService.setToken(user.access_token);
        this._auth.startRefreshTokenTimer();
        // Migrate guest data to user account
        this._migrationService.migrateGuestDataToUser();
        // Refresh cart and wishlist data for the new user
        this._cartService.initCartLocalStorage();
        this._wishlistService.initWishlistLocalStorage();
        this._router.navigate(['/']);
      },
      (error: HttpErrorResponse) => {
        this.authError = true;
        if (error.status !== 400) {
          this.authMessage = error.message;
        }
      }
    );
  }

  get loginForm() {
    return this.loginFormGroup.controls;
  }
  /*
    ----------------------------------------
    ========== visibility Toggle ===========
    ----------------------------------------
  */
  visibilityToggle() {
    if (this.passwordVisible == false) {
      this.passwordVisible = true
    }
    else {
      this.passwordVisible = false
    }
  }

  ngOnInit(): void {
    this.initLoginForm()
  }

}
