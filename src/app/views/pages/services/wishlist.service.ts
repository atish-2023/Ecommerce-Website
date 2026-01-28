import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Cart, CartItem, CartItemDetailed } from '../models/cart';
import { WishList } from '../models/wishlist';
import { AuthService } from '../auth/services/auth.service';
import { LocalstorageService } from '../auth/services/localstorage.service';

export const WISHLIST_KEY = 'wishlist';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  wishList$: BehaviorSubject<WishList> = new BehaviorSubject(this.getWishlist());
  private tokenSubscription: Subscription | null = null;
  private currentToken: string | null = null;

  constructor(
    private authService: AuthService,
    private localStorageService: LocalstorageService
  ) {
    // Initialize the current token
    this.currentToken = this.localStorageService.getToken();
    
    // Watch for token changes
    this.tokenSubscription = this.localStorageService.token$.subscribe(token => {
      if (token !== this.currentToken) {
        this.currentToken = token;
        this.refreshWishlistData();
      }
    });
  }

  // Get user-specific wishlist key
  private getUserWishlistKey(): string {
    const userKey = this.authService.getUserStorageKey();
    return `${WISHLIST_KEY}_${userKey}`;
  }

  initWishlistLocalStorage() {
    const Wishlist: WishList = this.getWishlist();
    if (!Wishlist) {
      const wishListCart = {
        items: []
      };
      const wishListCartJson = JSON.stringify(wishListCart);
      localStorage.setItem(this.getUserWishlistKey(), wishListCartJson);
    }
  }

  emptyCart() {
    const wishListCart = {
      items: []
    };
    const wishListCartJson = JSON.stringify(wishListCart);
    localStorage.setItem(this.getUserWishlistKey(), wishListCartJson);
    this.wishList$.next(wishListCart);
  }

  // Clean up subscription
  ngOnDestroy() {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }


  getWishlist(): WishList {
    const wishlistJsonString = localStorage.getItem(this.getUserWishlistKey());
    if (!wishlistJsonString) {
      return { items: [] };
    }
    const cart: Cart = JSON.parse(wishlistJsonString);
    return cart;
  }

  // Refresh wishlist data when user changes
  private refreshWishlistData(): void {
    const newWishlist = this.getWishlist();
    this.wishList$.next(newWishlist);
  }


  setWishItem(cartItem: CartItem, updateCartItem?: boolean): Cart {
    const WishList = this.getWishlist();
    const cartItemExist = WishList.items?.find((item) => item.product.id === cartItem.product.id);
    if (cartItemExist) {
      WishList.items?.map((item) => {
        if (item.product.id === cartItem.product.id) {
          // if (updateCartItem) {
          //   item.quantity = cartItem.quantity;
          // } else {
          //   item.quantity = item.quantity! + cartItem.quantity!;
          // }

          // return item;
        }
      });
    } else {
      WishList.items?.push(cartItem);
    }

    const cartJson = JSON.stringify(WishList);
    localStorage.setItem(this.getUserWishlistKey(), cartJson);
    this.wishList$.next(WishList);
    return WishList;
  }

  deleteWishItem(productId: string) {
    const WishList = this.getWishlist();
    const newWishList = WishList.items?.filter((item) => item.product.id !== productId);

    WishList.items = newWishList;

    const wishListJsonString = JSON.stringify(WishList);
    localStorage.setItem(this.getUserWishlistKey(), wishListJsonString);

    this.wishList$.next(WishList);
  }
}
