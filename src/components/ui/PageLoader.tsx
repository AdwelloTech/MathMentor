import React from 'react';
import Math3DSpinner from './Math3DSpinner';

interface PageLoaderProps {
  text?: string;
  fullscreen?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  text = 'Loading...',
  fullscreen = true
}) => {
  const containerClasses = fullscreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <Math3DSpinner size="xl" text={text} />
    </div>
  );
};

export default React.memo(PageLoader);

