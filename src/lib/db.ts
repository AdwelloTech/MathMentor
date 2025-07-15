import { supabase } from './supabase';
import type { UserProfile } from '@/types/auth';

// Subscription management
export const db = {
  // Profile operations
  profiles: {
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id: string, updates: Partial<UserProfile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    create: async (profile: Partial<UserProfile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },

  // Subscription operations
  subscriptions: {
    create: async (subscription: {
      user_id: string;
      profile_id: string;
      stripe_customer_id: string;
      stripe_subscription_id: string;
      stripe_payment_intent_id?: string;
      package_type: 'silver' | 'gold';
      status: string;
      current_period_start: string;
      current_period_end: string;
      amount_paid: number;
      currency?: string;
    }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscription])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },

  // Payment history operations
  paymentHistory: {
    create: async (payment: {
      user_id: string;
      subscription_id?: string;
      stripe_payment_intent_id: string;
      stripe_charge_id?: string;
      amount: number;
      currency?: string;
      status: 'succeeded' | 'pending' | 'failed' | 'cancelled';
      payment_method_type?: string;
      description?: string;
      receipt_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('payment_history')
        .insert([payment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  },

  // Package pricing operations
  packagePricing: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('package_pricing')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      return data;
    },

    getByType: async (packageType: string) => {
      const { data, error } = await supabase
        .from('package_pricing')
        .select('*')
        .eq('package_type', packageType)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
  },
};

// Helper function to create subscription after successful payment
export const createSubscriptionFromPayment = async (
  userId: string,
  paymentIntentId: string,
  packageType: 'silver' | 'gold'
) => {
  try {
    // Get user profile
    const profile = await db.profiles.getById(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Calculate subscription period (1 month from now)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create subscription record
    const subscription = await db.subscriptions.create({
      user_id: userId,
      profile_id: profile.id,
      stripe_customer_id: `demo_customer_${userId.substr(0, 8)}`, // Demo mode
      stripe_subscription_id: `demo_sub_${paymentIntentId}`, // Demo mode
      stripe_payment_intent_id: paymentIntentId,
      package_type: packageType,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      amount_paid: packageType === 'silver' ? 2999 : 4999, // in cents
      currency: 'usd',
    });

    // Create payment history record
    await db.paymentHistory.create({
      user_id: userId,
      subscription_id: subscription.id,
      stripe_payment_intent_id: paymentIntentId,
      amount: packageType === 'silver' ? 2999 : 4999,
      currency: 'usd',
      status: 'succeeded',
      payment_method_type: 'card',
      description: `${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package Subscription`,
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}; 