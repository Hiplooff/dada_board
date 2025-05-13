import React from 'react';

/**
 * Button component that doesn't rely on external dependencies
 */
const Button = React.forwardRef(({ 
  className = '',
  variant = 'default',
  size = 'default',
  children,
  ...props 
}, ref) => {
  // Define button styles
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  // Variant styles
  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    ghost: "bg-transparent hover:bg-gray-100",
    link: "text-blue-600 underline-offset-4 hover:underline bg-transparent"
  };
  
  // Size styles
  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6",
    icon: "h-10 w-10"
  };
  
  // Compute final className
  const buttonClassName = [
    baseStyles,
    variantStyles[variant] || variantStyles.default,
    sizeStyles[size] || sizeStyles.default,
    className
  ].join(' ');
  
  return (
    <button 
      className={buttonClassName} 
      ref={ref} 
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button }; 