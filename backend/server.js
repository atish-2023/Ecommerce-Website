const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/jwtAuth');
const { 
  readUsers, 
  findUserByEmail, 
  createUser, 
  validatePassword, 
  hashPassword, 
  updateLastLogin 
} = require('./userHelper');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4242;

// Configure CORS for production deployment
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:4200', // Allow deployed frontend
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send('Ecommerce Backend with Stripe Integration');
});

// User Login Endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Validate password
    const isValidPassword = await validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login timestamp
    const updatedUser = updateLastLogin(user.id);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      access_token: token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Registration Endpoint
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const newUser = createUser({
      name,
      email,
      password: hashedPassword,
      role: 'customer'
    });
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        name: newUser.name 
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      access_token: token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for password reset functionality)
app.get('/api/v1/users', (req, res) => {
  try {
    const users = readUsers();
    // Return users without password field
    const usersWithoutPasswords = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile Endpoint (JWT Protected)
app.get('/api/v1/auth/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    const { cartItems, customerInfo } = req.body;

    // Validate request
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.log('Invalid cart items:', cartItems);
      return res.status(400).json({ error: 'Cart items are required' });
    }

    if (!customerInfo) {
      console.log('Missing customer info');
      return res.status(400).json({ error: 'Customer information is required' });
    }

    console.log('Processing cart items:', cartItems.length);
    console.log('Customer info:', customerInfo);

    // Transform cart items to Stripe line items
    const lineItems = [];
    
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      console.log(`Processing item ${i}:`, item);
      
      // Handle incomplete product data
      if (!item.product) {
        console.log('Missing product data for item:', item);
        return res.status(400).json({ error: `Missing product data for item ${i}` });
      }
      
      // Provide default values for missing product properties
      const product = {
        id: item.product.id || `item_${i}`,
        title: item.product.title || 'Unknown Product',
        price: item.product.price !== undefined ? item.product.price : 0,
        images: item.product.images || []
      };
      
      console.log(`Processed product ${i}:`, product);
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            images: product.images && product.images.length > 0 ? [product.images[0]] : [],
            description: `Product ID: ${product.id}`
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      });
    }

    console.log('Line items created:', lineItems);

    // Add shipping cost
    const shippingCost = 50; // $50 shipping
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping Cost',
            description: 'Express delivery (3-4 days via Fedex)'
          },
          unit_amount: shippingCost * 100,
        },
        quantity: 1,
      });
    }
    
    console.log('Final line items with shipping:', lineItems);

    // Validate required fields before Stripe API call
    console.log('=== VALIDATION START ===');
    console.log('Customer Email:', customerInfo.email);
    console.log('Line Items Count:', lineItems.length);
    
    if (!customerInfo.email || !customerInfo.email.includes('@')) {
      console.log('❌ VALIDATION FAILED: Invalid customer email:', customerInfo.email);
      return res.status(400).json({ error: 'Valid customer email is required' });
    }
    
    if (!lineItems || lineItems.length === 0) {
      console.log('❌ VALIDATION FAILED: No valid line items found');
      return res.status(400).json({ error: 'No valid items in cart' });
    }
    
    console.log('✅ Basic validation passed');
    
    // Validate each line item
    console.log('=== LINE ITEM VALIDATION ===');
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      console.log(`Item ${i}:`, item);
      
      if (!item.price_data) {
        console.log(`❌ Item ${i}: Missing price_data`);
        return res.status(400).json({ error: `Item ${i}: Missing price information` });
      }
      
      if (!item.price_data.unit_amount) {
        console.log(`❌ Item ${i}: Missing unit_amount. Price data:`, item.price_data);
        return res.status(400).json({ error: `Item ${i}: Missing price amount` });
      }
      
      if (item.price_data.unit_amount <= 0) {
        console.log(`❌ Item ${i}: Invalid unit_amount: ${item.price_data.unit_amount}`);
        return res.status(400).json({ error: `Item ${i}: Invalid price amount` });
      }
      
      if (!item.quantity || item.quantity <= 0) {
        console.log(`❌ Item ${i}: Invalid quantity: ${item.quantity}`);
        return res.status(400).json({ error: `Item ${i}: Invalid quantity` });
      }
      
      console.log(`✅ Item ${i} validation passed`);
    }
    console.log('✅ All line items validated successfully');
    
    console.log('All validations passed. Creating Stripe session...');
    
    // Create checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      customer_email: customerInfo.email,
      metadata: {
        // Minimal identifiers for order tracking
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerEmail: customerInfo.email,
        itemCount: cartItems.length.toString(),
        // Store only essential customer info (within 500 char limit)
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`.substring(0, 100),
        // Reference to full order data stored in your database
        orderReference: `ref_${Date.now()}`
      }
    });

    // Store full order details in your database
    const orderData = {
      orderId: session.metadata.orderId,
      orderReference: session.metadata.orderReference,
      customerInfo: customerInfo,
      cartItems: cartItems,
      totalAmount: lineItems.reduce((total, item) => {
        return total + (item.price_data.unit_amount * item.quantity);
      }, 0) / 100, // Convert back to dollars
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
      status: 'pending_payment'
    };
    
    // Save to file-based storage (in production, use a real database)
    saveOrder(orderData);
    
    console.log('=== ORDER DATA STORED ===');
    console.log('Order ID:', orderData.orderId);
    console.log('Customer:', orderData.customerInfo.email);
    console.log('Items:', orderData.cartItems.length);
    console.log('Total Amount: $', orderData.totalAmount);
    console.log('Stripe Session ID:', orderData.stripeSessionId);
    console.log('========================');
    
    // Return the full session URL for direct redirect (2025 standard)
    res.json({ 
      sessionId: session.id,
      url: session.url  // This is the key change - return the full URL
    });
  } catch (error) {
    console.error('Stripe API Error Details:');
    console.error('Error Type:', error.type);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Decline Code:', error.decline_code);
    console.error('Error Param:', error.param);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: `Card error: ${error.message}` });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: `Invalid request: ${error.message}` });
    } else if (error.type === 'StripeAPIError') {
      return res.status(502).json({ error: 'Stripe API is temporarily unavailable' });
    } else if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({ error: 'Authentication with Stripe failed' });
    } else if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({ error: 'Too many requests to Stripe API' });
    } else {
      // Generic error
      return res.status(500).json({ 
        error: 'Payment processing failed',
        debug_id: Date.now().toString() 
      });
    }
  }
});

// Get Checkout Session Status
app.get('/checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_details: session.customer_details,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Order Details by Session ID
app.get('/order/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const order = findOrderBySessionId(sessionId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      orderId: order.orderId,
      customerInfo: order.customerInfo,
      itemCount: order.cartItems.length,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      status: order.status
    });
  } catch (error) {
    console.error('Error retrieving order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get All Orders (for testing/admin)
app.get('/orders', (req, res) => {
  try {
    const orders = readOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for handling Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Fulfill the purchase...
      console.log('Payment successful for session:', session.id);
      // Here you would typically save the order to your database
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

// Helper function to read orders from file
function readOrders() {
  const ordersPath = path.join(__dirname, 'data', 'orders.json');
  if (!fs.existsSync(ordersPath)) {
    return [];
  }
  const data = fs.readFileSync(ordersPath, 'utf8');
  return JSON.parse(data);
}

// Helper function to write orders to file
function writeOrders(orders) {
  const ordersPath = path.join(__dirname, 'data', 'orders.json');
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

// Helper function to save order
function saveOrder(orderData) {
  const orders = readOrders();
  orders.push(orderData);
  writeOrders(orders);
  return orderData;
}

// Helper function to find order by session ID
function findOrderBySessionId(sessionId) {
  const orders = readOrders();
  return orders.find(order => order.stripeSessionId === sessionId);
}

// Validate Stripe key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

console.log('Stripe key loaded:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');

// Stripe setup
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});