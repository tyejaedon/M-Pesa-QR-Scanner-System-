import React from 'react';

export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  // Base: Switched to font-black and tracking-widest for that "Ledger" look
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300';

  const variants = {
    // Neutral: Slate/Zinc for metadata
    default: 'bg-zinc-800/50 text-zinc-400 border-zinc-700',
    
    // Success: Sharp Emerald for completed M-Pesa payments
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    
    // Error: High-impact Red for failed STK pushes
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    
    // Warning/Brand: Our signature Electric Orange
    warning: 'bg-orange-600/10 text-orange-600 border-orange-600/20',
    
    // Info: Deep Blue for system messages
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Small dot indicator for extra "Tech" feel */}
      <span className={`w-1 h-1 rounded-full mr-1.5 ${
        variant === 'success' ? 'bg-emerald-500 animate-pulse' : 
        variant === 'warning' ? 'bg-orange-600' : 
        variant === 'error' ? 'bg-red-500' : 'bg-current opacity-50'
      }`} />
      {children}
    </span>
  );
};

export default Badge;