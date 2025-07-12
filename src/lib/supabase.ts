import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'iems-web-app',
    },
  },
});

// Auth helper functions
export const auth = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  },

  // Update user password
  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
  },

  // Update user metadata
  updateUser: async (attributes: { email?: string; password?: string; data?: Record<string, any> }) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    
    if (error) throw error;
    return data;
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    return session;
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    return user;
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const db = {
  // Profiles table operations
  profiles: {
    // Get user profile by ID
    getById: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    // Create user profile
    create: async (profile: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Update user profile
    update: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Delete user profile
    delete: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },

    // Get all profiles with optional filters
    getAll: async (filters?: Record<string, any>) => {
      let query = supabase.from('profiles').select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  },

  // Generic database operations
  from: (table: string) => supabase.from(table),
  
  // Storage operations
  storage: {
    // Upload file
    upload: async (bucket: string, path: string, file: File) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      
      if (error) throw error;
      return data;
    },

    // Download file
    download: async (bucket: string, path: string) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      
      if (error) throw error;
      return data;
    },

    // Get public URL
    getPublicUrl: (bucket: string, path: string) => {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return data.publicUrl;
    },

    // Delete file
    delete: async (bucket: string, paths: string[]) => {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      
      if (error) throw error;
    },
  },
};

// Real-time subscriptions
export const realtime = {
  // Subscribe to table changes
  subscribe: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },

  // Subscribe to specific user's changes
  subscribeToUser: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` }, callback)
      .subscribe();
  },

  // Unsubscribe from channel
  unsubscribe: (channel: any) => {
    return supabase.removeChannel(channel);
  },
};

export default supabase; 