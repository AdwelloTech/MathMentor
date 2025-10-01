import apiClient from "./apiClient";

interface PackagePricing {
  id: string;
  package_type: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const packagePricingService = {
  // Get all active packages
  async getAll(): Promise<PackagePricing[]> {
    const packages = await apiClient.get<PackagePricing[]>('/api/packages');
    return packages;
  },

  // Get a specific package by type
  async getByType(packageType: string): Promise<PackagePricing | null> {
    try {
      const packageData = await apiClient.get<PackagePricing>(`/api/packages/${packageType}`);
      return packageData;
    } catch (error) {
      console.error("Error fetching package:", error);
      return null;
    }
  },

  // Get current student's package
  async getCurrentStudentPackage(
    studentId: string
  ): Promise<PackagePricing | null> {
    try {
      const packageData = await apiClient.get<PackagePricing>(`/api/packages/student/${studentId}`);
      return packageData;
    } catch (error) {
      console.error("Error fetching student package:", error);
      return null;
    }
  },

  // Update student's package
  async updateStudentPackage(
    studentId: string,
    packageType: string
  ): Promise<PackagePricing> {
    const response = await apiClient.put<PackagePricing>(`/api/packages/student/${studentId}`, {
      packageType
    });
    return response;
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
