import { useState, useEffect } from 'react';
import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-white/40 bg-white/60 px-4 sm:px-6 lg:px-8 dark:bg-slate-900/60 backdrop-blur-2xl dark:border-white/10 transition-colors z-20 sticky top-0">
      <div className="flex items-center gap-3 lg:gap-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Page title for smaller screens (hidden when sidebar visible on lg) */}
        <div className="ml-2 text-sm font-semibold lg:hidden">
          {(() => {
            const path = location.pathname === '/' ? 'Dashboard' : location.pathname.replace(/^\//, '').split('/')[0].replace(/-/g, ' ');
            return path.charAt(0).toUpperCase() + path.slice(1);
          })()}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={toggleTheme}
          className="rounded-full p-1.5 sm:p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
      </div>
    </header>
  );
}
