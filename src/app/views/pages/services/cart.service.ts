import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Cart, CartItem, CartItemDetailed } from '../models/cart';
import { AuthService } from '../auth/services/auth.service';
import { LocalstorageService } from '../auth/services/localstorage.service';

export const CART_KEY = 'cart';
@Injectable({
  providedIn: 'root'
})
export class CartService {
  cart$: BehaviorSubject<Cart> = new BehaviorSubject(this.getCart());
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
        this.refreshCartData();
      }
    });
  }

  // Get user-specific cart key
  private getUserCartKey(): string {
    const userKey = this.authService.getUserStorageKey();
    return `${CART_KEY}_${userKey}`;
  }

  initCartLocalStorage() {
    const cart: Cart = this.getCart();
    if (!cart) {
      const intialCart = {
        items: []
      };
      const intialCartJson = JSON.stringify(intialCart);
      localStorage.setItem(this.getUserCartKey(), intialCartJson);
    }
  }

  emptyCart() {
    const intialCart = {
      items: []
    };
    const intialCartJson = JSON.stringify(intialCart);
    localStorage.setItem(this.getUserCartKey(), intialCartJson);
    this.cart$.next(intialCart);
  }

  // Clean up subscription
  ngOnDestroy() {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }


  getCart(): Cart {
    const cartJsonString = localStorage.getItem(this.getUserCartKey());
    if (!cartJsonString) {
      return { items: [] };
    }
    const cart: Cart = JSON.parse(cartJsonString);
    return cart;
  }

  // Refresh cart data when user changes
  private refreshCartData(): void {
    const newCart = this.getCart();
    this.cart$.next(newCart);
  }


  setCartItem(cartItem: CartItem, updateCartItem?: boolean): Cart {
    const cart = this.getCart();
    const cartItemExist = cart.items?.find((item) => item.product.id === cartItem.product.id);
    if (cartItemExist) {
      cart.items?.map((item) => {
        if (item.product.id === cartItem.product.id) {
          if (updateCartItem) {
            item.quantity = cartItem.quantity;
          } else {
            item.quantity = item.quantity! + cartItem.quantity!;
          }

          // return item;
        }
      });
    } else {
      cart.items?.push(cartItem);
    }

    const cartJson = JSON.stringify(cart);
    localStorage.setItem(this.getUserCartKey(), cartJson);
    this.cart$.next(cart);
    return cart;
  }

  deleteCartItem(productId: string) {
    const cart = this.getCart();
    const newCart = cart.items?.filter((item) => item.product.id !== productId);

    cart.items = newCart;

    const cartJsonString = JSON.stringify(cart);
    localStorage.setItem(this.getUserCartKey(), cartJsonString);

    this.cart$.next(cart);
  }
}
