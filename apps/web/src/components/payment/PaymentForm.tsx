import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import stripePromise, { PACKAGE_PRICES, PACKAGE_PRICING_DISPLAY, createPaymentIntent } from '@/lib/stripe';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { StudentPackage } from '@/types/auth';

interface PaymentFormProps {
  packageType: 'silver' | 'gold';
  customerEmail: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  packageType,
  customerEmail,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Get card element
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Card element not found');
      }

      // Validate card element first
      const { error: cardError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          email: customerEmail,
        },
      });

      if (cardError) {
        setPaymentStatus('error');
        setErrorMessage(cardError.message || 'Invalid card information');
        onPaymentError(cardError.message || 'Invalid card information');
        return;
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo mode: simulate successful payment
      // In production, you would create a real payment intent on your backend
      // and then use stripe.confirmCardPayment with the real client_secret
      const mockPaymentIntentId = `pi_${Math.random().toString(36).substr(2, 24)}`;
      
      setPaymentStatus('success');
      onPaymentSuccess(mockPaymentIntentId);
      
      console.log('🎉 Demo Payment Successful!');
      console.log('💡 To process real payments, implement backend API to create payment intents');
      console.log('🔑 Use your secret key on backend:', 'sk_test_51OYCbPFUqDTwzZQx...');
    } catch (error: any) {
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      onPaymentError(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (paymentStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">
          Your {packageType} package subscription has been activated.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <CreditCardIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Complete Your Payment
          </h3>
          <p className="text-gray-600 mt-1">
            {packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package - {PACKAGE_PRICING_DISPLAY[packageType]}
          </p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="form-group">
            <label className="form-label text-sm font-medium text-gray-700">
              Card Number
            </label>
            <div className="mt-1 relative">
              <div className="input px-3 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                <CardNumberElement options={cardElementOptions} />
              </div>
            </div>
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <div className="mt-1">
                <div className="input px-3 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <CardExpiryElement options={cardElementOptions} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-sm font-medium text-gray-700">
                CVC
              </label>
              <div className="mt-1">
                <div className="input px-3 py-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <CardCvcElement options={cardElementOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {paymentStatus === 'error' && errorMessage && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </motion.div>
          )}

          {/* Security Notice */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <LockClosedIcon className="h-4 w-4 text-gray-500 mr-2" />
            <p className="text-xs text-gray-600">
              Your payment information is encrypted and secure. Powered by Stripe.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Processing...
                </>
              ) : (
                `Pay ${PACKAGE_PRICING_DISPLAY[packageType]}`
              )}
            </button>
          </div>
        </form>

        {/* Test Card Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-900 mb-1">Demo Mode - Use Test Cards:</p>
          <p className="text-xs text-blue-700">
            ✅ Success: 4242 4242 4242 4242 | ❌ Decline: 4000 0000 0000 0002
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Any future date | Any 3-digit CVC | Card validation active
          </p>
          <p className="text-xs text-blue-500 mt-1">
            💡 Real payments require backend API implementation
          </p>
        </div>
      </div>
    </div>
  );
};

// Main PaymentForm component with Stripe Elements wrapper
const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm; 