import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Math3DSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const Math3DSpinner: React.FC<Math3DSpinnerProps> = ({
  size = 'lg',
  className = '',
  text = 'Loading...',
  showText = true
}) => {
  const [currentSymbol, setCurrentSymbol] = useState(0);

  // Clean selection of essential math symbols
  const mathSymbols = [
    '∫', '∑', '∏', '∞', '∂', '∆', '∇', '∀', '∃', '∈',
    '⊂', '∪', '∩', '∧', '∨', '⇒', '≠', '≤', '≥', '≈'
  ];

  const sizeClasses = {
    sm: 'w-16 h-16 text-3xl',
    md: 'w-20 h-20 text-5xl',
    lg: 'w-28 h-28 text-7xl',
    xl: 'w-36 h-36 text-9xl'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSymbol((prev) => (prev + 1) % mathSymbols.length);
    }, 300); // Slower, more elegant cycling

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Simple green circular background */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500/10 border-2 border-green-500/30"
          style={{
            width: size === 'sm' ? '64px' : size === 'md' ? '80px' : size === 'lg' ? '112px' : '144px',
            height: size === 'sm' ? '64px' : size === 'md' ? '80px' : size === 'lg' ? '112px' : '144px',
          }}
          animate={{
            scale: [1, 1.05, 1],
            borderColor: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.3)']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Center math symbol with smooth transitions */}
        <div className={`${sizeClasses[size]} flex items-center justify-center relative z-10`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSymbol}
              className="absolute inset-0 flex items-center justify-center font-bold text-green-600 dark:text-green-400"
              style={{
                textShadow: '0 0 10px rgba(34, 197, 94, 0.3)',
                filter: 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.2))'
              }}
              initial={{
                scale: 0.8,
                opacity: 0,
                y: 10
              }}
              animate={{
                scale: [0.8, 1.1, 1],
                opacity: 1,
                y: 0
              }}
              exit={{
                scale: 0.8,
                opacity: 0,
                y: -10
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              {mathSymbols[currentSymbol]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtle rotating accent ring */}
        <motion.div
          className="absolute inset-1 rounded-full border border-green-400/20"
          style={{
            width: size === 'sm' ? '48px' : size === 'md' ? '64px' : size === 'lg' ? '88px' : '112px',
            height: size === 'sm' ? '48px' : size === 'md' ? '64px' : size === 'lg' ? '88px' : '112px',
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {showText && (
        <motion.p
          className="mt-4 text-gray-700 dark:text-gray-300 font-medium text-center text-sm"
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default React.memo(Math3DSpinner);

