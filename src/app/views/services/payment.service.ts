import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartItem } from '../pages/models/cart';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  house: string;
  postalcode: string;
  zip: string;
  message?: string;
}

export interface CreateCheckoutSessionRequest {
  cartItems: CartItem[];
  customerInfo: CustomerInfo;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;  // Added for 2025 Stripe integration standard
}

export interface CheckoutSessionStatus {
  status: string;
  payment_status: string;
  customer_details: any;
  metadata: any;
}

export interface OrderDetails {
  orderId: string;
  customerInfo: CustomerInfo;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:4242'; // Backend URL

  constructor(private http: HttpClient) { }

  createCheckoutSession(request: CreateCheckoutSessionRequest): Observable<CreateCheckoutSessionResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CreateCheckoutSessionResponse>(
      `${this.apiUrl}/create-checkout-session`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getCheckoutSessionStatus(sessionId: string): Observable<CheckoutSessionStatus> {
    return this.http.get<CheckoutSessionStatus>(
      `${this.apiUrl}/checkout-session/${sessionId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  getOrderDetails(sessionId: string): Observable<OrderDetails> {
    return this.http.get<OrderDetails>(
      `${this.apiUrl}/order/${sessionId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('=== PAYMENT SERVICE ERROR ===');
    console.error('Error Status:', error.status);
    console.error('Error Status Text:', error.statusText);
    console.error('Error URL:', error.url);
    console.error('Error Object:', error);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error && error.error.error) {
      errorMessage = error.error.error;
      console.error('Backend Error Message:', error.error.error);
    } else if (error.message) {
      errorMessage = error.message;
      console.error('Error Message:', error.message);
    } else if (error.status) {
      errorMessage = `Server error: ${error.status} - ${error.statusText}`;
    }
    
    console.error('Final Error Message:', errorMessage);
    console.error('===============================');
    
    return throwError(() => new Error(errorMessage));
  }
}