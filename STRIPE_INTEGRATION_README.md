# Stripe Checkout Integration Guide

This document explains how to set up and use the Stripe Checkout integration in your e-commerce application.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Test Mode**: Enable test mode in your Stripe dashboard
3. **API Keys**: Get your publishable and secret keys from the Stripe dashboard

## Setup Instructions

### 1. Configure Stripe API Keys

**Backend (.env file)**:
```env
STRIPE_SECRET_KEY=sk_test_YourSecretKeyHere
STRIPE_PUBLISHABLE_KEY=pk_test_YourPublishableKeyHere
```

**Frontend (environment.ts)**:
```typescript
export const environment = {
  production: false,
  api: 'https://api.escuelajs.co/api/',
  stripePublicKey: 'pk_test_YourPublishableKeyHere'
};
```

### 2. Start Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:4242`

### 3. Start Frontend Application

```bash
npm install
npm start
```

The frontend will run on `http://localhost:4200`

## How It Works

### 1. User Flow
1. User adds items to cart
2. User navigates to checkout
3. User fills in billing/shipping details
4. User clicks "Pay Now with Stripe" button
5. User is redirected to Stripe Checkout page
6. User completes payment
7. User is redirected back to success page
8. Cart is automatically cleared

### 2. Technical Flow
1. Angular form collects customer info
2. Angular service sends cart items and customer info to backend
3. Backend creates Stripe Checkout Session
4. Backend returns session ID to frontend
5. Frontend redirects user to Stripe Checkout
6. Stripe handles payment processing
7. User is redirected back to success/cancel URLs
8. Frontend verifies payment status and clears cart

## File Structure

### Backend Files
- `backend/server.js` - Main server with Stripe endpoints
- `backend/.env` - Environment variables (API keys)
- `backend/package.json` - Backend dependencies

### Frontend Files
- `src/app/views/services/payment.service.ts` - Angular service for Stripe API calls
- `src/app/views/pages/checkout/checkout-page.component.ts` - Checkout page logic
- `src/app/views/pages/checkout/checkout-page.component.html` - Checkout page UI
- `src/app/views/pages/checkout/checkout-complete.component.ts` - Success page logic
- `src/app/views/pages/checkout/checkout-complete.component.html` - Success page UI
- `src/environments/environment.ts` - Frontend environment configuration

## Security Best Practices

### 1. Never expose secret keys
- Secret keys are stored only in backend `.env` file
- Never commit `.env` files to version control
- Use different keys for development and production

### 2. Environment Variables
- Use `.env` file for local development
- Use environment variables in production (e.g., Heroku, Vercel)
- Never hardcode API keys in frontend code

### 3. CORS Configuration
- Backend is configured to accept requests only from your frontend URL
- Update `FRONTEND_URL` in `.env` if you change frontend port

### 4. HTTPS in Production
- Use HTTPS for all communications in production
- Stripe requires HTTPS for production environments

## Testing with Stripe Test Mode

### 1. Test Cards
Use these test card numbers:
- **Visa**: 4242 4242 4242 4242
- **Visa (declined)**: 4000 0000 0000 0002
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

### 2. Test Process
1. Fill in any valid billing information
2. Use any future expiration date
3. Use any 3-digit CVC
4. Use any ZIP/postal code

### 3. Verification
- Check Stripe Dashboard for successful payments
- Verify that cart is cleared after successful payment
- Check that user is redirected to correct success page

## Webhook Integration (Optional)

For production, you should implement webhooks to handle:
- Payment confirmations
- Subscription updates
- Refunds
- Disputes

Update the webhook secret in your backend `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_YourWebhookSecretHere
```

## Troubleshooting

### Common Issues

1. **"No such API key" error**
   - Check that `STRIPE_SECRET_KEY` is correctly set in `.env`
   - Ensure you're using test keys for development

2. **CORS errors**
   - Verify `FRONTEND_URL` in `.env` matches your frontend URL
   - Check that backend server is running

3. **Stripe redirect fails**
   - Check that `stripePublicKey` is set correctly in environment.ts
   - Verify that `@stripe/stripe-js` is installed

4. **Cart not clearing**
   - Ensure the success route handler is called
   - Check browser console for errors

### Debugging Tips

1. Check browser console for JavaScript errors
2. Check backend console for server errors
3. Use Stripe Dashboard logs to debug payment issues
4. Enable Stripe test mode logging in dashboard settings

## Production Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Use production Stripe keys (live mode)
3. Ensure HTTPS is enabled
4. Set proper CORS origins

### Frontend Deployment
1. Update `environment.prod.ts` with live Stripe key
2. Build with `ng build --prod`
3. Deploy to your hosting platform
4. Ensure HTTPS is enabled

## Additional Features You Can Add

1. **Saved Payment Methods**
2. **Subscription Handling**
3. **Refund Management**
4. **Invoice Generation**
5. **Tax Calculation**
6. **Shipping Integration**
7. **Order History**
8. **Email Notifications**

## Support

For issues with this integration:
1. Check the Stripe documentation: [https://stripe.com/docs](https://stripe.com/docs)
2. Review the Stripe API reference: [https://stripe.com/docs/api](https://stripe.com/docs/api)
3. Check the Angular Stripe SDK: [https://github.com/stripe/stripe-js](https://github.com/stripe/stripe-js)

## License

This integration is provided as-is for educational purposes.