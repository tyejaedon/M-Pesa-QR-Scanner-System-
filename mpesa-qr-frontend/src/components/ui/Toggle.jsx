import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Dark Mode"
      className="
        relative flex items-center w-16 h-8 p-1 
        bg-zinc-100 border border-zinc-200 
        dark:bg-brand-gray dark:border-zinc-800 
        rounded-full cursor-pointer 
        transition-colors duration-300 ease-in-out 
        hover:border-brand-orange/50
        group
      "
    >
      {/* The Sliding Thumb (Puck) */}
      <div 
        className={`
          absolute z-10 w-6 h-6 
          bg-brand-orange 
          rounded-full shadow-md shadow-brand-orange/20 
          flex items-center justify-center
          transition-transform duration-500 cubic-bezier(0.23, 1, 0.32, 1)
          ${theme === 'dark' ? 'translate-x-8' : 'translate-x-0'}
        `}
      >
        {/* Icon inside the thumb */}
        {theme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-zinc-950 fill-current rotate-0 transition-all duration-300" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-zinc-950 fill-current rotate-0 transition-all duration-300" />
        )}
      </div>

      {/* Background Track Icons (Visual Indicators) */}
      <div className="flex justify-between w-full px-1.5">
        <Sun className={`w-3.5 h-3.5 text-zinc-400 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
        <Moon className={`w-3.5 h-3.5 text-zinc-600 dark:text-zinc-500 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;