import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { idVerificationService } from "@/lib/idVerificationService";
import DashboardService from "@/lib/dashboardService";
import type { TutorApplication } from "@/types/auth";
import type { TutorDashboardStats } from "@/lib/dashboardService";

export const useTutorDashboardData = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<TutorApplication | null>(null);
  const [idVerification, setIdVerification] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<TutorDashboardStats | null>(null);

  const checkApplication = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const result = await apiClient.get<any[]>('/api/tutors/applications');
      if (result && result.length > 0) {
        setApplication(result[0]);
      } else {
        setApplication(null);
      }
    } catch (error: any) {
      console.error("Error checking application:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIDVerification = async () => {
    if (!user || !profile) return;

    try {
      const verification = await idVerificationService.getVerificationByUserId();
      setIdVerification(verification);
    } catch (error) {
      console.error("Error checking ID verification:", error);
      setIdVerification(null);
    }
  };

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      const stats = await DashboardService.getTutorStats(profile.id);
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    checkApplication();
    checkIDVerification();
  }, [user]);

  useEffect(() => {
    if (
      application?.application_status === "approved" &&
      idVerification?.verification_status === "approved"
    ) {
      loadDashboardData();
    }
  }, [application, idVerification]);

  return {
    loading,
    application,
    idVerification,
    dashboardStats,
    checkApplication,
    checkIDVerification,
    loadDashboardData,
  };
};

