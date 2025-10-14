import React from 'react';
import Math3DSpinner from './Math3DSpinner';

interface GameLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GameLoadingAnimation: React.FC<GameLoadingAnimationProps> = ({
  size = 'md',
  className = ''
}) => {
  // Map old sizes to new sizes
  const newSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl';

  return (
    <Math3DSpinner
      size={newSize}
      className={className}
      showText={false}
    />
  );
};

export default GameLoadingAnimation;
