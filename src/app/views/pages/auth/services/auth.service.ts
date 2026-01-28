import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalstorageService } from './localstorage.service';
import { map, switchMap } from 'rxjs/operators';
import { ConfigService } from '../../../../config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  refreshTokenTimeout: any;

  constructor(
    private http: HttpClient,
    private _token: LocalstorageService,
    private router: Router,
    private configService: ConfigService
  ) { }

  private getApiUrl(): string {
    // Use runtime config if available, otherwise fall back to environment
    if (typeof window !== 'undefined' && this.configService.getConfig()) {
      return this.configService.getApiUrl();
    }
    return environment.api;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.getApiUrl()}v1/auth/login`, { email, password });
  }

  register(name: string, email: string, password: string): Observable<any> {
    let avatar = 'https://api.escuelajs.co/api/v1/files/8483.jpg'
    return this.http.post<any>(`${this.getApiUrl()}v1/auth/register`, { name, email, password, avatar });
  }

  loggedIn() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const tokenDecode = JSON.parse(atob(token.split('.')[1]));
      if (Math.floor(new Date().getTime() / 1000) >= tokenDecode.exp) {
        return false;
      }
      else {
        return true;
      }
    }
    return false;
  }

  logout() {
    this._token.removeToken();
    // Clear user-specific cart and wishlist data
    this.clearUserData();
    this.router.navigate(['/auth']);
  }

  // Clear user-specific data from localStorage
  private clearUserData() {
    const userKey = this.getUserStorageKey();
    const cartKey = `cart_${userKey}`;
    const wishlistKey = `wishlist_${userKey}`;
    
    localStorage.removeItem(cartKey);
    localStorage.removeItem(wishlistKey);
  }

  refreshToken(): Observable<any> {
    const token = this._token.getToken();
    return this.http.post<any>(`${this.getApiUrl()}v1/auth/refresh-token`, { token }).pipe(
      map((response: any) => {

        this._token.setToken(response.access_token);

        const expiration = response.refresh_token;
        localStorage.setItem('expiration', expiration);

        this.startRefreshTokenTimer();
        return true;
      })
    );
  }

  // Updated reset password method that actually calls the API
  resetPassword(email: string, newPassword: string): Observable<any> {
    // First, we need to find the user by email to get their ID
    // Using the users endpoint to find user by email
    return this.http.get<any[]>(`${this.getApiUrl()}v1/users`).pipe(
      map((users: any[]) => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          throw new Error('User not found');
        }
        return user.id;
      }),
      // Use switchMap instead of map to properly return the observable
      switchMap((userId: number) => {
        // Now update the password for this user
        return this.updatePassword(userId, newPassword);
      })
    );
  }

  // Updated password update method that actually calls the API
  updatePassword(userId: number, newPassword: string): Observable<any> {
    // Get the current token for authentication
    const token = this._token.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Update the user's password using the PUT endpoint
    return this.http.put<any>(`${this.getApiUrl()}v1/users/${userId}`, 
      { password: newPassword },
      { headers }
    ).pipe(
      map((response: any) => {
        // After successful password update, log the user out to force re-authentication
        // This ensures the old JWT token is invalidated and the user must log in with new password
        this.logout();
        return response;
      })
    );
  }

  // Alternative method to reset password using a more direct approach
  resetPasswordDirect(email: string, newPassword: string): Observable<any> {
    // First, let's try to get the current user's token to ensure we're authenticated
    const token = this._token.getToken();
    if (!token) {
      return throwError(() => new Error('No authentication token found. Please log in again.'));
    }

    // Get all users to find the specific user
    return this.http.get<any[]>(`${this.getApiUrl()}v1/users`).pipe(
      switchMap((users: any[]) => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          throw new Error('User not found');
        }
        
        console.log(`Found user: ${user.id}, updating password...`);
        
        // Update the user with the new password
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        // Try updating only the password field first
        return this.http.put<any>(`${this.getApiUrl()}v1/users/${user.id}`, 
          { 
            password: newPassword  // Only update password
          },
          { headers }
        ).pipe(
          catchError(updateError => {
            console.error('Error updating password with minimal data:', updateError);
            
            // If the minimal update fails, try with full user data
            return this.http.put<any>(`${this.getApiUrl()}v1/users/${user.id}`, 
              { 
                email: user.email,
                name: user.name,
                password: newPassword,  // Update the password
                avatar: user.avatar,
                role: user.role
              },
              { headers }
            );
          })
        );
      }),
      map((response: any) => {
        console.log('Password update response:', response);
        // After successful password update, log the user out to force re-authentication
        this.logout();
        return response;
      }),
      catchError((error) => {
        console.error('Password update error details:', error);
        // Return a user-friendly error message
        if (error.status === 404) {
          return throwError(() => new Error('User not found'));
        } else if (error.status === 401) {
          return throwError(() => new Error('Unauthorized. Please log in again.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('Forbidden. You do not have permission to update this user.'));
        } else if (error.status === 0) {
          return throwError(() => new Error('Network error. Please check your connection.'));
        } else {
          const errorMessage = error.error?.message || error.message || 'Failed to update password. Please try again.';
          return throwError(() => new Error(errorMessage));
        }
      })
    );
  }

  // Removed the changePassword method since we handle it differently in the profile component
  // Optional: Method to get user email from token (helper function)
  getCurrentUserEmail(): string {
    const token = this._token.getToken();
    if (token) {
      try {
        const tokenDecode = JSON.parse(atob(token.split('.')[1]));
        // The actual property might vary depending on the API response
        return tokenDecode.email || tokenDecode.sub || '';
      } catch (e) {
        console.error('Error decoding token:', e);
        return '';
      }
    }
    return '';
  }

  // Get user ID from token
  getCurrentUserId(): string {
    const token = this._token.getToken();
    if (token) {
      try {
        const tokenDecode = JSON.parse(atob(token.split('.')[1]));
        return tokenDecode.userId || tokenDecode.id || '';
      } catch (e) {
        console.error('Error decoding token for user ID:', e);
        return '';
      }
    }
    return '';
  }

  // Get user identifier for localStorage keys
  getUserStorageKey(): string {
    const userId = this.getCurrentUserId();
    const userEmail = this.getCurrentUserEmail();
    // Return a unique key based on user ID or email
    return userId || userEmail || 'guest';
  }

  forgetPassword(email: string): Observable<any> {
    // Mock implementation since the API doesn't support forget password
    // In a real app, this would call the API to send reset email
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ message: 'Password reset link sent to your email' });
        observer.complete();
      }, 1000); // Simulate delay
    });
  }

  startRefreshTokenTimer() {
    console.log('start Refresh Token Timer');
    const jwtToken = this._token.getToken();
    if (!jwtToken) {
      return;
    }
    const jwtTokenDecode = JSON.parse(atob(jwtToken.split('.')[1]));
    const expires = new Date(jwtTokenDecode.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    console.log('timeout', timeout);
    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }
}