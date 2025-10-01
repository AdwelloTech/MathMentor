import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GameLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GameLoadingAnimation: React.FC<GameLoadingAnimationProps> = ({
  size = 'md',
  className = ''
}) => {
  const [currentSymbol, setCurrentSymbol] = useState(0);
  const mathSymbols = ['+', '-', '×', '÷', '=', '∑', '∫', '∞', 'Δ', 'θ', 'λ'];

  // Cycle through math symbols
  useEffect(() => {
    const symbolInterval = setInterval(() => {
      setCurrentSymbol((prev) => (prev + 1) % mathSymbols.length);
    }, 300);

    return () => clearInterval(symbolInterval);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8 text-9xl',
    md: 'w-12 h-12 text-9xl',
    lg: 'w-16 h-16 text-9xl'
  };

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${className}`}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        key={currentSymbol}
        className={`${sizeClasses[size]} flex items-center justify-center font-bold bg-gradient-to-br from-emerald-400 to-amber-400 bg-clip-text text-transparent`}
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut"
        }}
      >
        {mathSymbols[currentSymbol]}
      </motion.div>
    </motion.div>
  );
};

export default GameLoadingAnimation;
