import React from 'react';

/**
 * Card Component
 * A flexible container with optional shadow and border.
 */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader Component
 * Used at the top of a card for titles and actions.
 */
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 py-4 border-b border-gray-100 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardContent Component
 * The main body area of the card.
 */
export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 py-4 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * CardTitle Component
 * Standardized typography for card headings.
 */
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-lg font-bold text-gray-900 leading-tight ${className}`} 
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * CardDescription Component
 * Secondary text for providing context within a card.
 */
export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p 
      className={`text-sm text-gray-500 mt-1 ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
};

export default Card;