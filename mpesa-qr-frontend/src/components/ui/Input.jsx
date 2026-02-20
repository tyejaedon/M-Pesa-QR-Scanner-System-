import React from 'react';

const Input = ({ 
  className = '', 
  type = 'text', 
  placeholder = '', 
  value, 
  onChange, 
  disabled = false,
  required = false,
  id,
  name,
  autoComplete,
  onKeyPress,
  ...props 
}) => {
  return (
    <input
      id={id}
      name={name}
      type={type}
      className={`
        w-full h-14 px-5 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl
        text-zinc-950 dark:text-white font-bold placeholder:text-zinc-700
        focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10
        disabled:opacity-30 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      onKeyPress={onKeyPress}
      {...props}
    />
  );
};

export default Input;