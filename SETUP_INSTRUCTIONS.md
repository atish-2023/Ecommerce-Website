# Stripe Integration Setup Checklist

## ✅ Step 1: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (already installed)
npm install
```

## ✅ Step 2: Configure Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test Publishable Key** (starts with `pk_test_`)
3. Copy your **Test Secret Key** (starts with `sk_test_`)

## ✅ Step 3: Update Configuration Files

### Backend (.env)
```env
# Replace with your actual keys
STRIPE_SECRET_KEY=sk_test_YourActualSecretKey
STRIPE_PUBLISHABLE_KEY=pk_test_YourActualPublishableKey
```

### Frontend (environment.ts)
```typescript
stripePublicKey: 'pk_test_YourActualPublishableKey' // Replace with your key
```

## ✅ Step 4: Start Servers

### Terminal 1 - Start Backend
```bash
cd backend
npm run dev
# Should show: Server running on port 4242
```

### Terminal 2 - Start Frontend
```bash
npm start
# Should show: Angular Live Development Server is listening on localhost:4200
```

## ✅ Step 5: Test the Integration

### Test Process:
1. Open browser to `http://localhost:4200`
2. Add some products to cart
3. Go to checkout
4. Fill in billing details:
   - First Name: John
   - Last Name: Doe
   - Email: test@example.com
   - Phone: 1234567890
   - Address: 123 Test Street
   - House: 1A
   - Postal Code: 12345
   - Zip: 12345
5. Click "Pay Now with Stripe"
6. On Stripe page, use test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/30)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
7. Click "Pay" on Stripe page
8. You should be redirected to success page
9. Cart should be cleared
10. Check Stripe Dashboard for the payment

## ✅ Step 6: Verify Success

### What You Should See:
- ✅ Loading spinner during payment processing
- ✅ Redirect to Stripe Checkout page
- ✅ Successful payment confirmation
- ✅ Redirect back to your success page
- ✅ Cart is empty after successful payment
- ✅ Order confirmation with order number

### What You Should Check in Stripe Dashboard:
- Payment appears in test mode
- Correct amount charged
- Customer details match
- Metadata includes cart items

## 🛠️ Troubleshooting

### If you see errors:
1. **Check browser console** for JavaScript errors
2. **Check backend terminal** for server errors
3. **Verify API keys** are correct
4. **Ensure both servers are running**
5. **Check network tab** for failed API requests

### Common Fixes:
- Make sure you're using **test keys**, not live keys
- Ensure `.env` file is in the `backend` directory
- Check that ports 4200 and 4242 are not in use
- Clear browser cache and try again

## 🎉 Success!

Once everything works, you're ready to:
1. Deploy to production
2. Switch to live Stripe keys
3. Add more features (webhooks, subscriptions, etc.)

## 📚 Next Steps

1. Read `STRIPE_INTEGRATION_README.md` for detailed documentation
2. Implement webhooks for production
3. Add order history functionality
4. Set up email notifications
5. Add tax calculation
6. Integrate shipping providers