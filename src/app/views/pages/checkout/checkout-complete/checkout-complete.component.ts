import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-checkout-complete',
  templateUrl: './checkout-complete.component.html',
  styleUrls: ['./checkout-complete.component.css']
})
export class CheckoutCompleteComponent implements OnInit {

  totalPrice!: number;
  today: number = Date.now();
  sessionId: string | null = null;
  orderNumber: string = '120';
  orderDetails: any = null;
  loading: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private _cartService: CartService,
    private paymentService: PaymentService,
  ) { }

  navigateToStore() {
    this.router.navigate(['/'])
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
  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    this.getTotalPrice();
    
    if (this.sessionId) {
      this.loadOrderDetails(this.sessionId);
    } else {
      // Generate random order number if no session ID
      this.orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
      this.loading = false;
    }
  }

  loadOrderDetails(sessionId: string) {
    // Fetch order details from backend
    this.paymentService.getOrderDetails(sessionId).subscribe(
      (order: any) => {
        this.orderDetails = order;
        this.orderNumber = order.orderId || this.orderNumber;
        this.totalPrice = order.totalAmount || this.totalPrice;
        this.loading = false;
        console.log('Order details loaded:', order);
      },
      (error: any) => {
        console.error('Error loading order details:', error);
        // Fallback to generated order number
        this.orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
        this.loading = false;
      }
    );
  }

}
