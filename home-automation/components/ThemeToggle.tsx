'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-[280px] h-[44px]">
        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded-md h-full w-full"></div>
      </div>
    );
  }

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Светлая' },
    { value: 'dark' as const, icon: Moon, label: 'Тёмная' },
    { value: 'system' as const, icon: Monitor, label: 'Авто' }
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${theme === value
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
