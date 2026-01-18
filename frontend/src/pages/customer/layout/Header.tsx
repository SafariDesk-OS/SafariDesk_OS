import React, { useState } from 'react';
import {
  BookOpen,
  Sun,
  Moon,
  Monitor,
  Home,
  Search,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import http from '../../../services/http';
import { APIS } from '../../../services/apis';
import { errorNotification } from '../../../components/ui/Toast';

const navLinks = [
  { to: '/helpcenter', label: 'Overview', icon: Home },
  { to: '/helpcenter/kb', label: 'Knowledge Base', icon: BookOpen },
];

export const CustomerHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const location = useLocation();
  const { theme, toggleTheme } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      await http.post(`${APIS.SEARCH_TICKET}${searchQuery}`, {
      });

      navigate(`/helpcenter/tk/${searchQuery}`);
      setSearchQuery('');
    } catch (error: any) {
      errorNotification(error?.response?.data?.message || 'Ticket not found.');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      default:
        return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const initials = 'SD';

  return (
    <div className="sticky top-0 z-40 border-b border-emerald-100/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100 flex items-center justify-center font-semibold">
              {initials}
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Help Center
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                SafariDesk
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Customer requests and knowledge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ThemeIcon size={18} />
            </button>

            {user ? (
              <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.first_name.charAt(0) || 'N'}
                {user?.last_name.charAt(0) || 'A'}
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <nav className="flex flex-wrap gap-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100'
                    : 'bg-white text-gray-700 hover:text-emerald-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <form
            onSubmit={handleSearch}
            className="flex w-full lg:w-auto items-center gap-2"
          >
            <div className="relative flex-1 lg:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search ticket by reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
