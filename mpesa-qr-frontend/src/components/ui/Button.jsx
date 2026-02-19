import React from 'react';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  // Base: Switched to rounded-2xl and font-black for a high-end feel
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    // Primary Action: The Electric Orange
    default: 'bg-orange-600 text-zinc-950 dark:text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20',
    
    // Stealth: Zinc-based for secondary dashboard actions
    ghost: 'bg-transparent hover:bg-orange-600/10 text-zinc-400 hover:text-orange-500',
    
    // High-Contrast: White text with deep borders
    outline: 'border-2 border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-950 dark:text-white hover:bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-700',
    
    // M-Pesa Identity: Professional Emerald
    success: 'bg-emerald-600 text-zinc-950 dark:text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20',
    
    // Warning/Alert: High-impact Rose
    destructive: 'bg-red-600 text-zinc-950 dark:text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
    
    // Surface: Zinc 800 for UI panels
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
  };

  const sizes = {
    // Optimized for S22 "Fat-Finger" usability (h-12 minimum)
    default: 'px-6 py-4 text-xs',
    sm: 'px-4 py-2 text-[10px]',
    lg: 'px-8 py-5 text-sm tracking-[0.2em]',
    icon: 'p-3 w-12 h-12',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;