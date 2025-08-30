import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';



const TutorialOverlay: React.FC = () => {
  const {
    isTutorialActive,
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
    skipTutorial,
    shouldShowTutorial
  } = useTutorial();

  const overlayRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);

  // Get tutorial steps from context instead of hardcoded values
  const { tutorialSteps } = useTutorial();

  useEffect(() => {
    if (isTutorialActive && currentStep < tutorialSteps.length) {
      const targetElement = document.querySelector(tutorialSteps[currentStep].target);
      if (targetElement) {
        targetElementRef.current = targetElement as HTMLElement;
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isTutorialActive, currentStep]);

  if (!isTutorialActive || !shouldShowTutorial) {
    return null;
  }

  const currentStepData = tutorialSteps[currentStep];
  if (!currentStepData) return null;

  const getTooltipPosition = () => {
    if (!targetElementRef.current) return { top: '50%', left: '50%' };

    const targetRect = targetElementRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 320;
    const tooltipHeight = 140;

    let top = 0;
    let left = 0;

    // Calculate position based on step preference
    switch (currentStepData.position) {
      case 'top':
        top = targetRect.top - tooltipHeight - 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - 20;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + 20;
        
        // Special handling for sidebar navigation - ensure tooltip is visible
        if (currentStepData.target === '#sidebar-navigation') {
          // If sidebar is on the left edge, position tooltip to the right of sidebar
          if (targetRect.left < 100) {
            left = targetRect.right + 20;
          }
          // If tooltip would go off-screen, position it above the sidebar instead
          if (left + tooltipWidth > viewportWidth - 20) {
            top = targetRect.top - tooltipHeight - 20;
            left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
          }
        }
        break;
      default:
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    }

    // Ensure tooltip stays within viewport
    if (left < 20) left = 20;
    if (left > viewportWidth - tooltipWidth - 20) left = viewportWidth - tooltipWidth - 20;
    if (top < 20) top = 20;
    if (top > viewportHeight - tooltipHeight - 20) top = viewportHeight - tooltipHeight - 20;



    return { top: `${top}px`, left: `${left}px` };
  };

  const position = getTooltipPosition();

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={skipTutorial}
      >


        {/* Tooltip */}
        <motion.div
          className="absolute w-80 bg-white rounded-lg shadow-xl border border-gray-200"
          style={position}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {currentStep + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStepData.title}
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
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousStep}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
              )}
              <Button
                onClick={nextStep}
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>
                  {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                </span>
                {currentStep < totalSteps - 1 && (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <motion.div
                className="bg-blue-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialOverlay;
