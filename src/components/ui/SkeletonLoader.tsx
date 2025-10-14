import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  count = 1,
  height = 'h-4',
  width = 'w-full'
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${height} ${width} ${className} bg-gray-200 rounded animate-pulse`}
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </>
  );
};

export default React.memo(SkeletonLoader);

