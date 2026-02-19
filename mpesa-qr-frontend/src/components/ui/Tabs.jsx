import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export const Tabs = ({ defaultValue, 
  value, 
  onValueChange, 
  children, 
  className = '', 
  ...props }) => {
  const [internalTab, setInternalTab] = useState(defaultValue);
  
  const activeTab = value !== undefined ? value : internalTab;
  
  const setActiveTab = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    setInternalTab(newValue);
  };

  return (
  <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Rebranded: Deep Zinc background with extra padding for mobile targets
export const TabsList = ({ children, className = '', ...props }) => (
  <div className={`inline-flex h-14 items-center justify-center rounded-[2rem] bg-zinc-100 dark:bg-zinc-900 p-1.5 text-zinc-500 border border-zinc-200 dark:border-zinc-800/50 shadow-inner ${className}`} {...props}>
    {children}
  </div>
);

// Rebranded: Bold Orange active states with high-contrast text
export const TabsTrigger = ({ value, children, className = '', ...props }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[1.5rem] px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-30 active:scale-95 ${
        isActive 
          ? 'bg-orange-600 text-zinc-950 dark:text-white shadow-lg shadow-orange-600/20 italic' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
      } ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

// Rebranded: Smooth fade-in for content switching
export const TabsContent = ({ value, children, className = '', ...props }) => {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;

  return (
    <div className={`mt-6 animate-in fade-in zoom-in-95 duration-300 outline-none ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Tabs;