import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { packagePricingService } from "../lib/packagePricing";
import PaymentForm from "../components/payment/PaymentForm";
import toast from "react-hot-toast";
import type { Database } from "../types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Star,
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

    const requiresPayment =
      packageType && ["silver", "gold"].includes(packageType);

    if (requiresPayment) {
      setPendingUpgrade(packageType);
      setShowPayment(true);
      return;
    }

    await completeUpgrade(packageType);
  };

  const completeUpgrade = async (
    packageType: string,
    _paymentIntentId?: string
  ) => {
    if (!user) return;

    try {
      setUpgrading(packageType);

      const updatedPackage = await packagePricingService.updateStudentPackage(
        user.id,
        packageType
      );

      await updatePackage(packageType as "free" | "silver" | "gold");

      setCurrentPackage(updatedPackage);

      await loadPackages();

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
      <StudentPageWrapper
        backgroundClass="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        className="text-foreground"
      >
        <div className="min-h-screen flex items-center justify-center">
          <Card className="border-0 bg-slate-800/80 backdrop-blur-sm shadow-2xl rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Loading Packages
                </h3>
                <p className="text-base text-slate-300">
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
    <StudentPageWrapper
      backgroundClass="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      className="text-foreground min-h-screen"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Select Package
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            {currentPackage
              ? `You're currently on the ${currentPackage.display_name}. Upgrade to unlock more features!`
              : "Choose a package that fits your learning needs"}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <Card className="bg-red-500/10 border-red-500/30 border-2 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentPackage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-2xl rounded-3xl text-white overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white/90 mb-1">
                      Your Current Package
                    </h2>
                    <p className="text-3xl font-bold text-white">
                      {currentPackage.display_name}
                    </p>
                  </div>
                </div>
                <p className="text-white/90 mb-6 text-lg">
                  You're enjoying all the benefits of the{" "}
                  {currentPackage.display_name}.
                  {canUpgrade("gold") &&
                    " Consider upgrading to unlock even more features!"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {packagePricingService
                    .getFeaturesList(currentPackage.features)
                    .map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-white bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="font-medium text-sm">{feature}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, index) => {
            const isGold = pkg.package_type === "gold";
            const isCurrent = isCurrentPackage(pkg.package_type);
            const requiresPayment = ["silver", "gold"].includes(
              pkg.package_type
            );

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className={`relative ${isGold ? "md:scale-105 z-10" : ""}`}
              >
                {isGold && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold px-4 py-1 text-sm border-0 shadow-lg">
                      <Star className="w-3 h-3 mr-1 inline" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={`relative border-2 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl ${
                    isGold
                      ? "border-yellow-500 bg-gradient-to-br from-slate-800 to-slate-900"
                      : "border-slate-700 bg-slate-800"
                  }`}
                >
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        {pkg.display_name}
                      </h3>
                      <div className="mb-6">
                        <div className="text-5xl font-bold text-white mb-2">
                          {packagePricingService.formatPrice(pkg.price_monthly)}
                          <span className="text-xl font-normal text-slate-400">
                            /month
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {packagePricingService.formatPrice(pkg.price_yearly)}
                          /year
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8 min-h-[300px]">
                      {packagePricingService
                        .getFeaturesList(pkg.features)
                        .map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-start gap-3 text-left"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                            <span className="text-slate-200 text-sm leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                      {isCurrent ? (
                        <div className="bg-blue-600/20 backdrop-blur-sm text-blue-400 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-blue-500/30">
                          <CheckCircle className="w-5 h-5" />
                          Current Package
                        </div>
                      ) : canUpgrade(pkg.package_type) ? (
                        <Button
                          onClick={() => handleUpgrade(pkg.package_type)}
                          disabled={upgrading === pkg.package_type}
                          className={`w-full px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                            isGold
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600"
                              : "bg-blue-600 text-white hover:bg-blue-700"
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
                        <div className="bg-slate-700/50 text-slate-400 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                          <Lock className="w-5 h-5" />
                          Downgrade Not Available
                        </div>
                      )}

                      {requiresPayment && (
                        <div className="text-center">
                          <p className="text-green-400 text-sm font-semibold">
                            Secure Payment Required
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <Card className="border-0 bg-slate-800/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-slate-700">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">
                  Package Benefits
                </h3>
                <p className="text-lg text-slate-300">
                  Discover what makes our learning platform exceptional
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-4 p-6 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      Group Classes
                    </h4>
                    <p className="text-slate-300 text-sm">
                      Learn with peers in interactive group sessions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      One-to-One Sessions
                    </h4>
                    <p className="text-slate-300 text-sm">
                      Personalized attention from expert tutors
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      Learning Resources
                    </h4>
                    <p className="text-slate-300 text-sm">
                      Access to premium study materials and tools
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      Progress Analytics
                    </h4>
                    <p className="text-slate-300 text-sm">
                      Track your learning progress and performance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      Priority Support
                    </h4>
                    <p className="text-slate-300 text-sm">
                      Get help when you need it most
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-slate-700/50 rounded-2xl border border-slate-600">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-2">
                      Premium Features
                    </h4>
                    <p className="text-slate-300 text-sm">
                      Exclusive tools and advanced capabilities
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {showPayment && pendingUpgrade && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 rounded-3xl shadow-3xl max-w-md w-full overflow-hidden border border-slate-700"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Complete Your Upgrade</h3>
                    <p className="text-white/90">
                      Upgrading to {pendingUpgrade} package
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handlePaymentCancel}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-xl"
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
