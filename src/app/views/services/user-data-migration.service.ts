import { Injectable } from '@angular/core';
import { CartService } from '../pages/services/cart.service';
import { WishlistService } from '../pages/services/wishlist.service';
import { AuthService } from '../pages/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserDataMigrationService {

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService
  ) { }

  // Migrate guest data to user account on login
  migrateGuestDataToUser(): void {
    const guestCartKey = 'cart_guest';
    const guestWishlistKey = 'wishlist_guest';
    
    const userCartKey = `cart_${this.authService.getUserStorageKey()}`;
    const userWishlistKey = `wishlist_${this.authService.getUserStorageKey()}`;
    
    // Check if guest data exists
    const guestCartData = localStorage.getItem(guestCartKey);
    const guestWishlistData = localStorage.getItem(guestWishlistKey);
    
    if (guestCartData) {
      // Migrate cart data to user
      localStorage.setItem(userCartKey, guestCartData);
      // Remove guest data
      localStorage.removeItem(guestCartKey);
      console.log('Guest cart data migrated to user account');
    }
    
    if (guestWishlistData) {
      // Migrate wishlist data to user
      localStorage.setItem(userWishlistKey, guestWishlistData);
      // Remove guest data
      localStorage.removeItem(guestWishlistKey);
      console.log('Guest wishlist data migrated to user account');
    }
    
    // Refresh cart and wishlist services
    this.cartService.initCartLocalStorage();
    this.wishlistService.initWishlistLocalStorage();
  }
}