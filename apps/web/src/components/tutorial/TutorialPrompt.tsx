import React from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import mathMentorLogo from '@/assets/math-mentor-logo.png';

const TutorialPrompt: React.FC = () => {
  const { shouldShowTutorial, startTutorial, skipTutorial } = useTutorial();
  const { profile } = useAuth();
  
  // Get role-specific content
  const isTutor = profile?.role === 'tutor';
  const welcomeTitle = isTutor ? 'Welcome to MathMentor Tutor!' : 'Welcome to MathMentor!';
  const welcomeMessage = isTutor 
    ? 'Welcome to your new tutor dashboard! Would you like to take a quick tour to learn about all the features available to you?'
    : 'Welcome to your new learning dashboard! Would you like to take a quick tour to learn about all the features available to you?';
  const tutorialDescription = isTutor
    ? 'This tutorial will show you around the tutor dashboard and help you get started with your teaching journey.'
    : 'This tutorial will show you around the dashboard and help you get started with your learning journey.';

  if (!shouldShowTutorial) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-4 right-4 z-40 w-80 bg-white rounded-lg shadow-xl border border-gray-200"
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img 
              src={mathMentorLogo} 
              alt="MathMentor Logo" 
              className="w-6 h-6 object-contain"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {welcomeTitle}
          </h3>
        </div>
        <button
          onClick={skipTutorial}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {welcomeMessage}
        </p>
        <p className="text-gray-500 text-xs">
          {tutorialDescription}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={skipTutorial}
          className="text-gray-600 hover:text-gray-800"
        >
          Maybe Later
        </Button>
        <Button
          onClick={startTutorial}
          size="sm"
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          <PlayIcon className="w-4 h-4" />
          <span>Start Tour</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default TutorialPrompt;
