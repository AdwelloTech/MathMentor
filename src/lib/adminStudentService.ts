import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Use the regular supabase client for admin operations
// RLS is disabled on the profiles table, so admin can access all data
const supabaseAdmin = supabase;

export interface Student {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: string;
  package: string;
  student_id: string;
  grade_level: string;
  phone: string | null;
  address: string | null;
  date_of_birth: string;
  gender: string | null;
  emergency_contact: string | null;
  age: number;
  has_learning_disabilities: boolean;
  learning_needs_description: string | null;
  profile_image_url: string | null;
  subscription_status: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_active: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface PackageInfo {
  package_type: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export class AdminStudentService {
  // Fetch all students from database using admin authentication
  static async getAllStudents(): Promise<Student[]> {
    try {
      console.log('Fetching all students with admin service...');
      
      // Use supabase client to access all profiles
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }

      console.log('Students fetched with admin service:', data?.length || 0);
      console.log('Sample students:', data?.slice(0, 2));
      
      // Transform the data to match our interface
      const transformedStudents = data?.map((student: any) => ({
        id: student.id,
        user_id: student.user_id || student.id,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        email: student.email || '',
        role: student.role || 'student',
        package: student.package || 'free',
        student_id: student.student_id || `STU${student.id.slice(0, 8)}`,
        grade_level: student.grade_level || 'Not specified',
        phone: student.phone || null,
        address: student.address || null,
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || null,
        emergency_contact: student.emergency_contact || null,
        age: student.age || 0,
        has_learning_disabilities: student.has_learning_disabilities || false,
        learning_needs_description: student.learning_needs_description || null,
        profile_image_url: student.profile_image_url || null,
        subscription_status: student.subscription_status || 'active',
        subscription_start_date: student.subscription_start_date || null,
        subscription_end_date: student.subscription_end_date || null,
        stripe_customer_id: student.stripe_customer_id || null,
        stripe_subscription_id: student.stripe_subscription_id || null,
        is_active: student.is_active !== undefined ? student.is_active : true,
        last_login: student.last_login || new Date().toISOString(),
        created_at: student.created_at || new Date().toISOString(),
        updated_at: student.updated_at || new Date().toISOString(),
      })) || [];

      console.log('Transformed students:', transformedStudents.slice(0, 2));
      return transformedStudents;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  // Get student statistics using admin authentication
  static async getStudentStats(): Promise<{
    total: number;
    active: number;
    byPackage: Record<string, number>;
    recentRegistrations: number;
  }> {
    try {
      console.log('Fetching student stats with admin service...');
      
      const { data: students, error } = await supabaseAdmin
        .from('profiles')
        .select('package, is_active, created_at')
        .eq('role', 'student');

      if (error) {
        console.error('Error fetching student stats:', error);
        return {
          total: 0,
          active: 0,
          byPackage: {},
          recentRegistrations: 0
        };
      }

      console.log('Students found with admin service:', students?.length);

      const total = students?.length || 0;
      const active = students?.filter((s: any) => s.is_active).length || 0;
      
      const byPackage: Record<string, number> = {};
      students?.forEach((student: any) => {
        const packageType = student.package || 'free';
        byPackage[packageType] = (byPackage[packageType] || 0) + 1;
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentRegistrations = students?.filter((s: any) => 
        new Date(s.created_at) >= oneWeekAgo
      ).length || 0;

      console.log('Stats calculated with admin service:', { total, active, byPackage, recentRegistrations });

      return {
        total,
        active,
        byPackage,
        recentRegistrations
      };
    } catch (error) {
      console.error('Error fetching student stats:', error);
      return {
        total: 0,
        active: 0,
        byPackage: {},
        recentRegistrations: 0
      };
    }
  }

  // Get package information
  static async getPackageInfo(): Promise<PackageInfo[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('package_pricing')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching package info:', error);
        // Return default package info if database table doesn't exist
        return [
          {
            package_type: 'free',
            display_name: 'Free Package',
            price_monthly: 0,
            price_yearly: 0,
            features: ['Group classes', 'Basic support', 'Basic dashboard']
          },
          {
            package_type: 'silver',
            display_name: 'Silver Package',
            price_monthly: 2999,
            price_yearly: 29990,
            features: ['Group classes', 'Learning resources', 'Priority support', 'Enhanced dashboard']
          },
          {
            package_type: 'gold',
            display_name: 'Gold Package',
            price_monthly: 4999,
            price_yearly: 49990,
            features: ['All Silver features', 'One-to-one sessions', 'Consultation booking', 'Premium resources', 'Advanced analytics']
          }
        ];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching package info:', error);
      return [];
    }
  }

  // Delete student
  static async deleteStudent(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id)
        .eq('role', 'student');

      if (error) {
        console.error('Error deleting student:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  // Update student information
  static async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('role', 'student')
        .select()
        .single();

      if (error) {
        console.error('Error updating student:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating student:', error);
      return null;
    }
  }
} 