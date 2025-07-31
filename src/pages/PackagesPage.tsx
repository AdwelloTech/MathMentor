import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { packagePricingService } from "../lib/packagePricing";
import PaymentForm from "../components/payment/PaymentForm";
import toast from "react-hot-toast";
import type { Database } from "../types/database";
import {
  CheckCircle,
  Crown,
  Star,
  CreditCard,
  ArrowUpCircle,
  Sparkles,
  Users,
  BookOpen,
  Video,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";

type PackagePricing = Database["public"]["Tables"]["package_pricing"]["Row"];

const PackagesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<PackagePricing[]>([]);
  const [currentPackage, setCurrentPackage] = useState<PackagePricing | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPackages();
    }
  }, [user]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const [allPackages, currentPkg] = await Promise.all([
        packagePricingService.getAll(),
        packagePricingService.getCurrentStudentPackage(user!.id),
      ]);
      setPackages(allPackages);
      setCurrentPackage(currentPkg);
    } catch (err) {
      console.error("Error loading packages:", err);
      setError("Failed to load packages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (packageType: string) => {
    if (!user) return;

    // Check if payment is required for the selected package
    const requiresPayment =
      packageType && ["silver", "gold"].includes(packageType);

    if (requiresPayment) {
      // Store the package type and show payment form
      setPendingUpgrade(packageType);
      setShowPayment(true);
      return;
    }

    // For free package, proceed directly
    await completeUpgrade(packageType);
  };

  const completeUpgrade = async (
    packageType: string,
    paymentIntentId?: string
  ) => {
    if (!user) return;

    try {
      setUpgrading(packageType);

      // Update the package in the database
      await packagePricingService.updateStudentPackage(user.id, packageType);

      // Reload packages to reflect the change
      await loadPackages();

      // Show success message
      toast.success("Package upgraded successfully!");
    } catch (err) {
      console.error("Error upgrading package:", err);
      toast.error("Failed to upgrade package. Please try again.");
    } finally {
      setUpgrading(null);
      setShowPayment(false);
      setPendingUpgrade(null);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (pendingUpgrade) {
      await completeUpgrade(pendingUpgrade, paymentIntentId);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(`Payment failed: ${error}`);
    setShowPayment(false);
    setPendingUpgrade(null);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPendingUpgrade(null);
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType.toLowerCase()) {
      case "gold":
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case "silver":
        return <Star className="w-6 h-6 text-gray-400" />;
      case "free":
        return <Sparkles className="w-6 h-6 text-blue-500" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes("group")) return <Users className="w-4 h-4" />;
    if (
      lowerFeature.includes("one-to-one") ||
      lowerFeature.includes("one on one")
    )
      return <Video className="w-4 h-4" />;
    if (lowerFeature.includes("consultation"))
      return <BookOpen className="w-4 h-4" />;
    if (
      lowerFeature.includes("analytics") ||
      lowerFeature.includes("dashboard")
    )
      return <BarChart3 className="w-4 h-4" />;
    if (lowerFeature.includes("support")) return <Shield className="w-4 h-4" />;
    if (lowerFeature.includes("premium") || lowerFeature.includes("advanced"))
      return <Zap className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const isCurrentPackage = (packageType: string) => {
    return currentPackage?.package_type === packageType;
  };

  const canUpgrade = (packageType: string) => {
    if (!currentPackage) return true;

    const packageOrder = ["free", "silver", "gold"];
    const currentIndex = packageOrder.indexOf(currentPackage.package_type);
    const targetIndex = packageOrder.indexOf(packageType);

    return targetIndex > currentIndex;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Package
          </h1>
          <p className="text-gray-600">
            {currentPackage
              ? `You're currently on the ${currentPackage.display_name}. Upgrade to unlock more features!`
              : "Choose a package that fits your learning needs"}
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-md p-4 mb-6"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Current Package Display */}
        {currentPackage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {getPackageIcon(currentPackage.package_type)}
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Current Package: {currentPackage.display_name}
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                You're enjoying all the benefits of the{" "}
                {currentPackage.display_name}.
                {canUpgrade("gold") &&
                  " Consider upgrading to unlock even more features!"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {packagePricingService
                  .getFeaturesList(currentPackage.features)
                  .map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-lg shadow-sm border-2 overflow-hidden ${
                isCurrentPackage(pkg.package_type)
                  ? "border-blue-500 bg-blue-50"
                  : pkg.package_type === "gold"
                  ? "border-yellow-400"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Popular Badge for Gold */}
              {pkg.package_type === "gold" && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    {getPackageIcon(pkg.package_type)}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {pkg.display_name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {packagePricingService.formatPrice(pkg.price_monthly)}
                    <span className="text-sm font-normal text-gray-500">
                      /month
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {packagePricingService.formatPrice(pkg.price_yearly)}/year
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {packagePricingService
                    .getFeaturesList(pkg.features)
                    .map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                </div>

                {/* Action Button */}
                <div className="text-center">
                  {isCurrentPackage(pkg.package_type) ? (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium">
                      Current Package
                    </div>
                  ) : canUpgrade(pkg.package_type) ? (
                    <button
                      onClick={() => handleUpgrade(pkg.package_type)}
                      disabled={upgrading === pkg.package_type}
                      className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                        pkg.package_type === "gold"
                          ? "bg-yellow-500 text-white hover:bg-yellow-600"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {upgrading === pkg.package_type ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Upgrading...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <ArrowUpCircle className="w-4 h-4" />
                          {pkg.package_type === "free"
                            ? "Select Free"
                            : "Upgrade Now"}
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-sm font-medium">
                      Downgrade Not Available
                    </div>
                  )}
                </div>

                {/* Secure Payment Note */}
                {pkg.package_type !== "free" &&
                  !isCurrentPackage(pkg.package_type) && (
                    <div className="mt-4 text-center">
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        Secure Payment Required
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Package Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Group Classes</h4>
                <p className="text-sm text-gray-600">
                  Learn with peers in interactive group sessions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">
                  One-to-One Sessions
                </h4>
                <p className="text-sm text-gray-600">
                  Personalized attention from expert tutors
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">
                  Learning Resources
                </h4>
                <p className="text-sm text-gray-600">
                  Access to premium study materials and tools
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">
                  Progress Analytics
                </h4>
                <p className="text-sm text-gray-600">
                  Track your learning progress and performance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Priority Support</h4>
                <p className="text-sm text-gray-600">
                  Get help when you need it most
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Premium Features</h4>
                <p className="text-sm text-gray-600">
                  Exclusive tools and advanced capabilities
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment Form Modal */}
      {showPayment && pendingUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Complete Your Upgrade
                </h3>
                <p className="text-gray-600">
                  You're upgrading to the {pendingUpgrade} package. Please
                  complete the payment.
                </p>
              </div>

              <PaymentForm
                packageType={pendingUpgrade as "silver" | "gold"}
                customerEmail={user?.email || ""}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
