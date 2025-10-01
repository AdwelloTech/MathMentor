import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { packagePricingService } from "../lib/packagePricing";
import PaymentForm from "../components/payment/PaymentForm";
import toast from "react-hot-toast";
import type { Database } from "../types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";

import {
  CheckCircle,
  Crown,
  ArrowUpCircle,
  Sparkles,
  Users,
  BookOpen,
  Video,
  BarChart3,
  Shield,
  Zap,
  Gift,
  X,
  Lock,
} from "lucide-react";

type PackagePricing = Database["public"]["Tables"]["package_pricing"]["Row"];

const PackagesPage: React.FC = () => {
  const { user, updatePackage } = useAuth();
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
    _paymentIntentId?: string
  ) => {
    if (!user) return;

    try {
      setUpgrading(packageType);

      // Update the package in the database
      const updatedPackage = await packagePricingService.updateStudentPackage(user.id, packageType);

      // Update AuthContext profile with new package
      await updatePackage(packageType as "free" | "silver" | "gold");

      // Update local state with the new package
      setCurrentPackage(updatedPackage);

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
      <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
        <div className="min-h-screen flex items-center justify-center">
          <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-card-foreground">
                  Loading Packages
                </h3>
                <p className="text-base text-muted-foreground">
                  Preparing your options...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Select Package
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {currentPackage
              ? `You're currently on the ${currentPackage.display_name}. Upgrade to unlock more features!`
              : "Choose a package that fits your learning needs"}
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <Card className="bg-destructive/10 border-destructive/30 border-2 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/20 rounded-xl">
                    <Shield className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Package Display */}
        {currentPackage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="bg-primary border-0 shadow-2xl rounded-3xl text-primary-foreground overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-primary-foreground mb-1">
                        Your Current Package
                      </h2>
                      <p className="text-3xl font-bold text-primary-foreground">
                        {currentPackage.display_name}
                      </p>
                    </div>
                  </div>
                  <p className="text-primary-foreground/80 mb-6 text-lg leading-relaxed">
                    You're enjoying all the benefits of the{" "}
                    {currentPackage.display_name}.
                    {canUpgrade("gold") &&
                      " Consider upgrading to unlock even more features!"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {packagePricingService
                      .getFeaturesList(currentPackage.features)
                      .map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-primary-foreground bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-4 py-3"
                        >
                          <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span className="font-medium">{feature}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-stretch">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative group"
            >
              <Card
                className={`relative border-0 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl h-[600px] flex flex-col ${
                  isCurrentPackage(pkg.package_type) || pkg.package_type !== "free"
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-card text-card-foreground border border-border"
                }`}
              >
                {/* Popular Badge for Gold */}

                {/* Current Package Badge */}

                <CardContent className="p-8 relative flex flex-col h-full">
                  {/* Subtle background pattern */}

                  <div className="relative flex flex-col h-full">
                    {/* Package Header */}
                    <div className="text-center mb-6">
                      <div className="flex justify-center mb-4"></div>
                      <h3 className="text-2xl font-bold mb-4">
                        {pkg.display_name}
                      </h3>
                      <div className="text-4xl font-bold mb-2">
                        {packagePricingService.formatPrice(pkg.price_monthly)}
                        <span className="text-lg font-normal opacity-75">
                          /month
                        </span>
                      </div>
                      <div className="text-sm opacity-75">
                        {packagePricingService.formatPrice(pkg.price_yearly)}
                        /year
                      </div>
                    </div>

                    {/* Features - Flexible content area */}
                    <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
                      {packagePricingService
                        .getFeaturesList(pkg.features)
                        .map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className={`flex items-center gap-3 p-3 rounded-xl ${
                              isCurrentPackage(pkg.package_type) || pkg.package_type !== "free"
                                ? "bg-primary-foreground/10 backdrop-blur-sm"
                                : "bg-secondary"
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg flex-shrink-0 ${
                                isCurrentPackage(pkg.package_type) || pkg.package_type !== "free"
                                  ? "bg-primary-foreground/20"
                                  : "bg-secondary/80"
                              }`}
                            >
                              {getFeatureIcon(feature)}
                            </div>
                            <span className={`font-medium text-sm leading-tight ${
                              isCurrentPackage(pkg.package_type) || pkg.package_type !== "free"
                                ? "text-primary-foreground"
                                : "text-secondary-foreground"
                            }`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Action Button - Fixed at bottom */}
                    <div className="mt-auto">
                      <div className="text-center mb-4">
                        {isCurrentPackage(pkg.package_type) ? (
                          <div className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Current Package
                          </div>
                        ) : canUpgrade(pkg.package_type) ? (
                          <Button
                            onClick={() => handleUpgrade(pkg.package_type)}
                            disabled={upgrading === pkg.package_type}
                            className={`w-full px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                              isCurrentPackage(pkg.package_type) || pkg.package_type !== "free"
                                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                          >
                            {upgrading === pkg.package_type ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Upgrading...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                {pkg.package_type === "free" ? (
                                  <Gift className="w-5 h-5" />
                                ) : (
                                  <ArrowUpCircle className="w-5 h-5" />
                                )}
                                {pkg.package_type === "free"
                                  ? "Select Free"
                                  : "Upgrade Now"}
                              </div>
                            )}
                          </Button>
                        ) : (
                          <div className="bg-muted text-muted-foreground px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                            <Lock className="w-5 h-5" />
                            Downgrade Not Available
                          </div>
                        )}
                      </div>

                      {/* Secure Payment Note */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-border">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-card-foreground mb-2">
                  Package Benefits
                </h3>
                <p className="text-lg text-muted-foreground">
                  Discover what makes our learning platform exceptional
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="flex items-start gap-4 p-6 bg-secondary rounded-2xl">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-card-foreground text-lg mb-2">
                      Group Classes
                    </h4>
                    <p className="text-muted-foreground">
                      Learn with peers in interactive group sessions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-secondary rounded-2xl">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg">
                    <Video className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-card-foreground text-lg mb-2">
                      One-to-One Sessions
                    </h4>
                    <p className="text-muted-foreground">
                      Personalized attention from expert tutors
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-secondary rounded-2xl">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-card-foreground text-lg mb-2">
                      Learning Resources
                    </h4>
                    <p className="text-muted-foreground">
                      Access to premium study materials and tools
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-secondary rounded-2xl">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-card-foreground text-lg mb-2">
                      Progress Analytics
                    </h4>
                    <p className="text-muted-foreground">
                      Track your learning progress and performance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-secondary rounded-2xl">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-card-foreground text-lg mb-2">
                      Priority Support
                    </h4>
                    <p className="text-muted-foreground">
                      Get help when you need it most
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-secondary rounded-2xl">
                  <div className="p-3 bg-secondary-foreground/10 rounded-2xl shadow-lg">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-card-foreground text-lg mb-2">
                      Premium Features
                    </h4>
                    <p className="text-muted-foreground">
                      Exclusive tools and advanced capabilities
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Form Modal */}
      {showPayment && pendingUpgrade && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl shadow-3xl max-w-md w-full overflow-hidden border border-border"
          >
            <div className="bg-primary p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-xl">
                    <Crown className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Complete Your Upgrade</h3>
                    <p className="text-primary-foreground/80">
                      Upgrading to {pendingUpgrade} package
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handlePaymentCancel}
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground hover:bg-primary-foreground/20 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <PaymentForm
                packageType={pendingUpgrade as "silver" | "gold"}
                customerEmail={user?.email || ""}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </StudentPageWrapper>
  );
};

export default PackagesPage;
