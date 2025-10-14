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

  // Enhanced math symbols with more variety
  const mathSymbols = [
    '∫', '∑', '∏', '∆', '∇', '∞', '∂', '∀', '∃', '∉',
    '∈', '∋', '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∧', '∨',
    '¬', '⇒', '⇔', '∴', '∵', '≅', '≈', '≠', '≤', '≥'
  ];

  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-4xl',
    lg: 'w-24 h-24 text-6xl',
    xl: 'w-32 h-32 text-8xl'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSymbol((prev) => (prev + 1) % mathSymbols.length);
    }, 150); // Faster cycling for more dynamic feel

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-r-amber-400"
          style={{
            width: size === 'sm' ? '48px' : size === 'md' ? '64px' : size === 'lg' ? '96px' : '128px',
            height: size === 'sm' ? '48px' : size === 'md' ? '64px' : size === 'lg' ? '96px' : '128px',
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Inner spinning ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-l-blue-400"
          style={{
            width: size === 'sm' ? '32px' : size === 'md' ? '48px' : size === 'lg' ? '64px' : '96px',
            height: size === 'sm' ? '32px' : size === 'md' ? '48px' : size === 'lg' ? '64px' : '96px',
          }}
          animate={{
            rotate: -360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Center math symbol with 3D effect */}
        <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSymbol}
              className="absolute inset-0 flex items-center justify-center font-bold bg-gradient-to-br from-emerald-400 via-amber-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl"
              style={{
                textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))'
              }}
              initial={{
                scale: 0,
                rotateY: -180,
                opacity: 0,
                z: -50
              }}
              animate={{
                scale: [0, 1.3, 1],
                rotateY: [180, 0, 0],
                opacity: 1,
                z: 0
              }}
              exit={{
                scale: 0,
                rotateY: 180,
                opacity: 0,
                z: -50
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              {mathSymbols[currentSymbol]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transformOrigin: 'center'
            }}
            animate={{
              x: Math.cos((i * 60 * Math.PI) / 180) * 40,
              y: Math.sin((i * 60 * Math.PI) / 180) * 40,
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {showText && (
        <motion.p
          className="mt-6 text-gray-600 font-medium text-center"
          animate={{
            opacity: [0.5, 1, 0.5]
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

