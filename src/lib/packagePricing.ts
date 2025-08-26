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

  // Update student's package (DEPRECATED - use confirmAndUpgrade for paid packages)
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

  // Secure package upgrade with payment verification
  async confirmAndUpgrade(
    userId: string,
    packageType: string,
    paymentIntentId?: string
  ): Promise<void> {
    // Normalize and validate target package
    const target = await this.getByType(packageType);
    if (!target) {
      throw new Error(`Unknown package type: ${packageType}`);
    }
    if (!target.is_active) {
      throw new Error(`Package ${packageType} is not active`);
    }

    // Idempotency: already on target
    const current = await this.getCurrentStudentPackage(userId);
    if (current?.package_type === packageType) return;

    // Prevent downgrade from client-side invocation
    const order = ["free", "silver", "gold"] as const;
    if (
      current &&
      order.indexOf(packageType as any) <=
        order.indexOf(current.package_type as any)
    ) {
      throw new Error("Downgrade not allowed");
    }

    // Determine payment requirement from pricing
    const requiresPayment =
      (target.price_monthly ?? 0) > 0 || (target.price_yearly ?? 0) > 0;

    // For free packages, proceed with direct update
    if (!requiresPayment) {
      return this.updateStudentPackage(userId, packageType);
    }

    // For paid packages, verify payment on server side
    if (!paymentIntentId) {
      throw new Error("Payment verification required for paid packages");
    }

    // TODO: Implement server-side payment verification (e.g., Supabase RPC or webhook)
    // Do not upgrade until verification exists to prevent abuse.
    throw new Error(
      "Paid package upgrade requires server-side verification; not yet implemented."
    );

    // Future implementation:
    // Call Supabase RPC function for secure payment verification
    // const { error } = await supabase.rpc("confirm_package_upgrade", {
    //   p_user_id: userId,
    //   p_package_type: packageType,
    //   p_payment_intent_id: paymentIntentId,
    // });
    //
    // if (error) {
    //   console.error("Error confirming package upgrade:", error);
    //   throw error;
    // }
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
