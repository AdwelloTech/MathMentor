import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
}

interface TutorialContextType {
  isTutorialActive: boolean;
  currentStep: number;
  totalSteps: number;
  tutorialSteps: TutorialStep[];
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  shouldShowTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const { profile } = useAuth();
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);

  // Tutorial steps configuration based on user role
  const getTutorialSteps = (): TutorialStep[] => {
    if (profile?.role === 'tutor') {
      return [
        {
          id: 'welcome',
          title: 'Welcome to MathMentor Tutor!',
          content: 'Let\'s take a quick tour of your tutor dashboard to help you get started.',
          target: '#tutor-welcome',
          position: 'bottom',
          order: 1
        },
        {
          id: 'status-overview',
          title: 'Account Status Overview',
          content: 'Here you can see your approval status, online status, and account information.',
          target: '#tutor-status-overview',
          position: 'top',
          order: 2
        },
        {
          id: 'stats-overview',
          title: 'Your Teaching Statistics',
          content: 'Track your total classes, students taught, monthly classes, and earnings.',
          target: '#tutor-stats',
          position: 'top',
          order: 3
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          content: 'Schedule classes, manage sessions, create quizzes, and view ratings.',
          target: '#tutor-quick-actions',
          position: 'top',
          order: 4
        },
        {
          id: 'schedule-class',
          title: 'Schedule Class',
          content: 'Click here to schedule a new class for your students.',
          target: '#schedule-class-button',
          position: 'left',
          order: 5
        },
        {
          id: 'online-status',
          title: 'Online Status Toggle',
          content: 'Toggle your online status to start receiving instant session requests from students.',
          target: '#online-status-toggle',
          position: 'right',
          order: 6
        },
        {
          id: 'profile-completion',
          title: 'Profile Completion',
          content: 'Complete your profile to unlock all tutor features and start receiving students.',
          target: '#tutor-profile-completion',
          position: 'top',
          order: 7
        }
      ];
    } else {
      // Student tutorial steps
      return [
        {
          id: 'welcome',
          title: 'Welcome to MathMentor!',
          content: 'Let\'s take a quick tour of your dashboard to help you get started.',
          target: '#dashboard-welcome',
          position: 'bottom',
          order: 1
        },
        {
          id: 'stats-overview',
          title: 'Your Progress Overview',
          content: 'Here you can see your learning statistics, upcoming sessions, and recent activities.',
          target: '#dashboard-stats',
          position: 'top',
          order: 2
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          content: 'Access your study materials, book sessions, and take quizzes from these quick action buttons.',
          target: '#quick-actions',
          position: 'top',
          order: 3
        },
        {
          id: 'recent-quizzes',
          title: 'Recent Quizzes',
          content: 'Review your most recent quizzes and quickly jump back in.',
          target: '#recent-quizzes',
          position: 'right',
          order: 4
        },
        {
          id: 'navigation',
          title: 'Navigation',
          content: 'Use the sidebar to navigate between different sections of your learning portal.',
          target: '#sidebar-navigation',
          position: 'left',
          order: 5
        },
        {
          id: 'study-materials',
          title: 'Study Materials',
          content: 'Access flashcards, notes, and other learning resources created by your tutors.',
          target: '#study-materials',
          position: 'right',
          order: 6
        },
        {
          id: 'upcoming-sessions',
          title: 'Upcoming Sessions',
          content: 'View and manage your scheduled tutoring sessions here.',
          target: '#upcoming-sessions',
          position: 'right',
          order: 7
        }
      ];
    }
  };

  const tutorialSteps = getTutorialSteps();

  const totalSteps = tutorialSteps.length;
  


  // Check if user should see tutorial
  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!profile?.user_id || (profile.role !== 'student' && profile.role !== 'tutor')) {
        setShouldShowTutorial(false);
        return;
      }

      try {
        // Use the new API instead of Supabase
        const response = await fetch('/api/tutorial/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('mathmentor_tokens') ? JSON.parse(localStorage.getItem('mathmentor_tokens')!).accessToken : ''}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Error checking tutorial status:', response.statusText);
          // Default to showing tutorial for new users
          setShouldShowTutorial(true);
          return;
        }

        const result = await response.json();
        if (!result.success || !result.data) {
          setShouldShowTutorial(true);
          return;
        }

        const tutorialData = result.data;

        // Check if user has completed tutorial
        if (tutorialData.tutorialCompleted) {
          setShouldShowTutorial(false);
          return;
        }

        // For existing users who haven't completed tutorial, show it less aggressively
        if (tutorialData.createdAt) {
          const accountAge = Date.now() - new Date(tutorialData.createdAt).getTime();
          const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

          // Show tutorial for:
          // 1. New accounts (less than 7 days old) - always show
          // 2. Older accounts (more than 7 days) - show based on dismissal count and last shown date
          if (daysSinceCreation <= 7) {
            setShouldShowTutorial(true);
          } else {
            // For older accounts, be more selective
            const dismissCount = tutorialData.tutorialDismissedCount || 0;
            const lastShown = tutorialData.tutorialLastShown;

            // Show tutorial if:
            // - User has dismissed it less than 3 times, OR
            // - It's been more than 30 days since last shown
            if (dismissCount < 3) {
              setShouldShowTutorial(true);
            } else if (lastShown) {
              const daysSinceLastShown = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
              setShouldShowTutorial(daysSinceLastShown > 30);
            } else {
              setShouldShowTutorial(false);
            }
          }
        } else {
          // Fallback: show tutorial for users without creation date
          setShouldShowTutorial(true);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
        setShouldShowTutorial(true);
      }
    };

    checkTutorialStatus();
  }, [profile?.user_id, profile?.role]);
  


  const startTutorial = () => {
    setIsTutorialActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = async () => {
    try {
      // Use the new API instead of Supabase
      const response = await fetch('/api/tutorial/dismiss', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mathmentor_tokens') ? JSON.parse(localStorage.getItem('mathmentor_tokens')!).accessToken : ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error dismissing tutorial:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating tutorial status:', error);
    }

    setIsTutorialActive(false);
    setShouldShowTutorial(false);
  };

  const completeTutorial = async () => {
    try {
      // Use the new API instead of Supabase
      const response = await fetch('/api/tutorial/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mathmentor_tokens') ? JSON.parse(localStorage.getItem('mathmentor_tokens')!).accessToken : ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error completing tutorial:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating tutorial status:', error);
    }

    setIsTutorialActive(false);
    setShouldShowTutorial(false);
  };

  const value: TutorialContextType = {
    isTutorialActive,
    currentStep,
    totalSteps,
    tutorialSteps,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    shouldShowTutorial
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
