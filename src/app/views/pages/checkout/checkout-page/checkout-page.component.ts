import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CartItem } from '../../models/cart';
import { CartService } from '../../services/cart.service';
import { PaymentService, CustomerInfo } from '../../../services/payment.service';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent implements OnInit {

  checkoutFormGroup!: FormGroup;
  isSubmitted = false;
  cartList!: CartItem[];
  totalPrice!: number;
  isCartEmpty: boolean = false;
  isLoading: boolean = false;
  stripePromise: any;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private _cartService: CartService,
    private formBuilder: FormBuilder,
    private paymentService: PaymentService,
  ) { 
    // Initialize Stripe with environment key
    this.stripePromise = loadStripe(environment.stripePublicKey);
  }

  getCartList() {
    this._cartService.cart$.subscribe((cart) => {
      this.cartList = cart.items!;
      if (this.cartList.length == 0) this.isCartEmpty = true;
      else this.isCartEmpty = false;
    });
  }

  getTotalPrice() {
    this._cartService.cart$.subscribe((cart) => {
      this.totalPrice = 0;
      if (cart) {
        cart.items?.map((item) => {
          this.totalPrice += item.product.price! * item.quantity!;
        });
      }
    });
  }


  initCheckoutForm() {
    this.checkoutFormGroup = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.email, Validators.required]],
      phone: ['', Validators.required],
      // city: ['', Validators.required],
      // country: ['', Validators.required],
      postalcode: ['', Validators.required],
      message: [''],
      zip: ['', Validators.required],
      house: ['', Validators.required],
      address: ['', Validators.required]
    });
  }


  get checkoutForm() {
    return this.checkoutFormGroup.controls;
  }
  async placeOrder() {
    this.isSubmitted = true;
    if (this.checkoutFormGroup.invalid || this.cartList.length === 0) {
      return;
    }

    this.isLoading = true;
    
    try {
      const customerInfo: CustomerInfo = {
        firstName: this.checkoutForm.firstName.value,
        lastName: this.checkoutForm.lastName.value,
        email: this.checkoutForm.email.value,
        phone: this.checkoutForm.phone.value,
        address: this.checkoutForm.address.value,
        house: this.checkoutForm.house.value,
        postalcode: this.checkoutForm.postalcode.value,
        zip: this.checkoutForm.zip.value,
        message: this.checkoutForm.message.value || ''
      };

      // Log the data being sent
      console.log('Sending cart items:', this.cartList);
      console.log('Sending customer info:', customerInfo);

      // Create checkout session
      const sessionResponse = await this.paymentService.createCheckoutSession({
        cartItems: this.cartList,
        customerInfo
      }).toPromise();

      // Redirect to Stripe Checkout using window.location.href (2025 standard)
      if (sessionResponse.url) {
        // Direct redirect to Stripe hosted page
        window.location.href = sessionResponse.url;
      } else {
        console.error('No URL returned from backend');
        this.isLoading = false;
        alert('Payment session creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.isLoading = false;
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      alert(`Payment Error: ${errorMessage}`);
    }
  }

  // Handle success route
  handleSuccessRoute() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.paymentService.getCheckoutSessionStatus(sessionId).subscribe(
        (session) => {
          if (session.payment_status === 'paid') {
            // Clear cart after successful payment
            this._cartService.emptyCart();
            // Navigate to success page with session data
            this.router.navigate(['/checkout/success'], { 
              queryParams: { session_id: sessionId } 
            });
          }
        },
        (error) => {
          console.error('Error checking session status:', error);
          // Navigate to error page
          this.router.navigate(['/checkout/cancel']);
        }
      );
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    this.getCartList();
    this.getTotalPrice();
    this.initCheckoutForm();
    
    // Check if we're on success route
    if (this.router.url.includes('/checkout/success')) {
      this.handleSuccessRoute();
    }
  }


}
