import { loadStripe } from '@stripe/stripe-js';

// Stripe Test Keys for Sandbox Mode
// Using your actual Stripe test keys
// Secret key (for backend): sk_test_51S141WF560wXRzgjBpEWdEY3AF0b0K72b7UxWdTXJ6usZpST9wkiQoZkHcN5tFCkDdE8kParbQvK80VhGYfaX71o00yjXQ21Hf
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51S141WF560wXRzgjZpZ0LjSIDxAB44sORJdeYrimlZOU0ttuSugMND7GDmIlF2gUdkBYBzpOrrVLaXCFE1lROW7U008xmvz6lQ';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Package pricing (in cents)
export const PACKAGE_PRICES = {
  free: 0,
  silver: 2999, // $29.99
  gold: 4999,   // $49.99
} as const;

// Package pricing display
export const PACKAGE_PRICING_DISPLAY = {
  free: '$0/month',
  silver: '$29.99/month',
  gold: '$49.99/month',
} as const;

// Export Stripe instance
export default stripePromise;

// Payment processing types
export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

// Function to create payment intent (this would typically be done on the backend)
export const createPaymentIntent = async (packageType: 'silver' | 'gold', customerEmail: string) => {
  // In a real application, this would be a call to your backend API using the secret key
  // Backend would use: sk_test_51S141WF560wXRzgjBpEWdEY3AF0b0K72b7UxWdTXJ6usZpST9wkiQoZkHcN5tFCkDdE8kParbQvK80VhGYfaX71o00yjXQ21Hf
  // For demo purposes, we'll simulate the response
  const amount = PACKAGE_PRICES[packageType];
  
  // This should be replaced with actual backend API call
  console.warn('DEMO MODE: In production, this should call your backend API to create payment intent with your secret key');
  
  // Generate a properly formatted mock client secret that Stripe will accept
  const randomId = Math.random().toString(36).substr(2, 24);
  const randomSecret = Math.random().toString(36).substr(2, 24);
  
  return {
    id: `pi_${randomId}`,
    client_secret: `pi_${randomId}_secret_${randomSecret}`,
    amount,
    currency: 'usd',
    status: 'requires_payment_method'
  } as PaymentIntent;
};

// Test credit card numbers for Stripe testing
// These work with your actual Stripe test account
export const TEST_CARDS = {
  visa: '4242424242424242',
  visa_declined: '4000000000000002',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  insufficient_funds: '4000000000009995'
} as const; 