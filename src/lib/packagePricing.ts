import { supabase } from "./supabase";
import type { Database } from "../types/database";

type PackagePricing = Database["public"]["Tables"]["package_pricing"]["Row"];

export const packagePricingService = {
  // Get all active packages
  async getAll(): Promise<PackagePricing[]> {
    const { data, error } = await supabase
      .from("package_pricing")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });

    if (error) {
      console.error("Error fetching packages:", error);
      throw error;
    }

    return data || [];
  },

  // Get a specific package by type
  async getByType(packageType: string): Promise<PackagePricing | null> {
    const { data, error } = await supabase
      .from("package_pricing")
      .select("*")
      .eq("package_type", packageType)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching package:", error);
      throw error;
    }

    return data;
  },

  // Get current student's package
  async getCurrentStudentPackage(
    studentId: string
  ): Promise<PackagePricing | null> {
    // First get the student's profile to see their current package
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("package")
      .eq("user_id", studentId)
      .single();

    if (profileError) {
      console.error("Error fetching student profile:", profileError);
      throw profileError;
    }

    if (!profile?.package) {
      return null; // Student has no package assigned
    }

    // Get the package details
    return this.getByType(profile.package);
  },

  // Update student's package
  async updateStudentPackage(
    studentId: string,
    packageType: string
  ): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ package: packageType })
      .eq("user_id", studentId);

    if (error) {
      console.error("Error updating student package:", error);
      throw error;
    }
  },

  // Format price for display (convert cents to dollars)
  formatPrice(priceInCents: number): string {
    return `$${(priceInCents / 100).toFixed(2)}`;
  },

  // Get package features as a formatted list
  getFeaturesList(features: string[]): string[] {
    return features.map((feature) => {
      // Clean up feature names for display
      return feature
        .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();
    });
  },
};
