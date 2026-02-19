import React from 'react';

/**
 * Card Component
 * Optimized for AMOLED depth and high-contrast FinTech UIs.
 */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-zinc-100 dark:bg-zinc-900 shadow-2xl rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800/50 overflow-hidden transition-all duration-300 hover:border-orange-600/30 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader Component
 * Clean separation with uppercase metadata styling.
 */
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-8 py-6 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900/50 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardContent Component
 * Generous padding for high-end mobile readability.
 */
export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-8 py-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardTitle Component
 * Bold, italicized, and aggressive FinTech typography.
 */
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-xl font-black text-zinc-950 dark:text-white italic uppercase tracking-tighter leading-none ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * CardDescription Component
 * High-contrast secondary text for technical context.
 */
export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p 
      className={`text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2 ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};

export default Card;