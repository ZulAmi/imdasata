import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  paddingY?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function PageContainer({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  paddingY = 'lg'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 ${paddingClasses[paddingY]} ${className}`}>
      {children}
    </div>
  );
}
