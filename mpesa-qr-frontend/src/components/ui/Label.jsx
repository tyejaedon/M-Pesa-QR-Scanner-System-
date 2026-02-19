import React from 'react';

/**
 * Label Component
 * High-contrast, technical typography for merchant data entry.
 */
export const Label = ({ children, className = '', htmlFor, ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
      // Rebranded: font-black, uppercase, and tracking-widest for a pro "FinTech" feel
      className={`block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;