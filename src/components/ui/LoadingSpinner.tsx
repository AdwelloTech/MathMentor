import React from 'react';
import Math3DSpinner from './Math3DSpinner';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
  showText = true
}) => {
  return (
    <Math3DSpinner
      size={size}
      className={className}
      text={text || 'Loading...'}
      showText={showText}
    />
  );
};

export default LoadingSpinner; 