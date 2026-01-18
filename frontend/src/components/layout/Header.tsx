import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Settings,
  Sparkles,
  LayoutDashboard,
  Ticket,
  CheckSquare,
  FileText,
  Users,
  UserCheck2,
  Lock,
  List,
  ChevronDown
} from 'lucide-react';
import Button from '../ui/Button';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { NotificationsDropdown } from "../notifications/NotificationsMenu";
import { useNotificationSocket } from "../../services/notifications/sockets";
import { Notification } from "../../types/notification";
import AISupportModal from '../AISupportModal';
import { GlobalSearchModal } from '../GlobalSearch/GlobalSearchModal';
import { APIS } from '../../services/apis';

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showUserMgmtDropdown, setShowUserMgmtDropdown] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { setSidebarOpen, theme, toggleTheme } = useUIStore();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAISupportModal, setShowAISupportModal] = useState(false);
  const [hasNotificationSnapshot, setHasNotificationSnapshot] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMgmtDropdownRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("token");
  const {
    requestNotifications,
    markOneAsRead,
    isConnected,
  } = useNotificationSocket(
    token, 
    (newNotification) => {
      console.log("🔔 Header: New notification received via WebSocket:", newNotification);
      setNotifications((prev) => {
        const next = [newNotification, ...prev];
        const seen = new Set<number>();
        return next.filter((item) => {
          if (seen.has(item.id)) {
            return false;
          }
          seen.add(item.id);
          return true;
        });
      });
    },
    (list) => {
      console.log("🔔 Header: onNotificationsList called with:", list);
      console.log("🔔 Header: Setting notifications to:", list.length, "items");
      setNotifications(list);
      setHasNotificationSnapshot(true);
    },
    (count) => {
      console.log("🔔 Header: onUnreadCountUpdate called with:", count);
      if (!hasNotificationSnapshot) {
        setUnreadCount(count);
      }
    },
    (unreadList) => {
      console.log("🔔 Header: onUnreadNotificationsList called with:", unreadList);
      setNotifications(unreadList);
      setHasNotificationSnapshot(true);
    }
  );

  const markAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.is_read);
    if (!unreadNotifications.length) {
      return;
    }

    const authToken = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!authToken) {
      console.warn('Missing auth token for marking notifications read.');
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch(`${APIS.NOTIFICATION_MARK_READ}${notification.id}/`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_read: true }),
          })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      requestNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // WebSocket connection status indicator (optional)
  useEffect(() => {
    if (isConnected) {
      console.log("✅ Header: WebSocket connected");
    } else {
      console.log("⚠️ Header: WebSocket disconnected");
    }
  }, [isConnected]);

  // Debug log whenever notifications state changes
  useEffect(() => {
    console.log("🔔 Header: notifications state updated:", notifications);
    console.log("🔔 Header: notifications count:", notifications.length);
  }, [notifications]);

  useEffect(() => {
    if (hasNotificationSnapshot) {
      const unread = notifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    }
  }, [notifications, hasNotificationSnapshot]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      default: return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: user?.role === 'admin' ? 'Tickets' : 'My Tickets', href: '/tickets', icon: Ticket },
      { name: user?.role === 'admin' ? 'Tasks' : 'My Tasks', href: '/tasks', icon: CheckSquare },
    ];

    const assetItems = user?.role === 'admin' ? [
      // { name: 'Requests', href: '/requests', icon: List },
    ] : [
      // { name: 'Requests', href: '/requests', icon: List },
      { name: 'Contacts', href: '/users/customers', icon: UserCheck2 },
      { name: 'Knowledge Base', href: '/knowledge', icon: FileText },
    ];

    const adminItems = [
      {
        name: 'User Mgnt',
        icon: Users,
        children: [
          { name: 'Agents', href: '/users/agents', icon: Users },
          { name: 'Customers', href: '/users/customers', icon: UserCheck2 },
          { name: 'Role & Permissions', href: '/users/roles', icon: Lock },
        ]
      },
      { name: 'Knowledge Base', href: '/knowledge', icon: FileText },
      { name: 'Configurations', href: '/config/general', icon: Settings },
    ];

    const allItems = user?.role === 'admin'
      ? [...baseItems, ...assetItems, ...adminItems]
      : [...baseItems, ...assetItems];

    return allItems;
  };

  const navigationItems = getNavigationItems();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMgmtDropdownRef.current && !userMgmtDropdownRef.current.contains(event.target as Node)) {
        setShowUserMgmtDropdown(false);
      }
    };
    if (showUserMgmtDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMgmtDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setShowMobileNav(false);
      }
    };
    if (showMobileNav) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMobileNav]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            {/* Business Logo/Name */}
            <div className="flex items-center space-x-3">
              {/* {businessLogoUrl ? (
                <img 
                  src={businessLogoUrl} 
                  alt={businessName || 'SafariDesk'} 
                  className="w-8 h-8 object-contain rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg shadow-md">
                  <span className="text-white text-sm font-bold">
                    {(businessName || user?.business?.name)?.[0]?.toUpperCase() || 'S'}
                  </span>
                </div>
              )} */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  { 'SafariDesk'}
                </h1>
              </div>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              icon={Menu}
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            />

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 cursor-pointer" size={16} />
              <input
                type="text"
                placeholder="Search everything..."
                onClick={() => setShowGlobalSearch(true)}
                readOnly
                className="pl-10 pr-4 py-2 w-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              icon={ThemeIcon}
              onClick={toggleTheme}
            />

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotifications((prev) => {
                    const next = !prev;
                    if (next) {
                      requestNotifications();
                    }
                    return next;
                  });
                }}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
                 )}
              </button>

              {showNotifications && (
              <NotificationsDropdown
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                isOpen
                onMarkAllAsRead={markAllNotificationsAsRead}
                onMarkOneAsRead={(id: number) => {
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
                  );
                  setUnreadCount((prev) => Math.max(prev - 1, 0));
                  markOneAsRead(id);
                }}
              />
            )}
            </div>

            {/* AI Support Icon */}
            <Button
              variant="ghost"
              size="sm"
              icon={Sparkles}
              onClick={() => setShowAISupportModal(true)}
              className="relative"
              title="AI Support (Coming Soon)"
            />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
               <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </span>
                )}
              </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.first_name} {user?.last_name}
                  </p>
                </div>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-slide-down" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/profile")
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User size={16} className="mr-3" />
                    Profile
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="relative">
          {/* Mobile Navigation Button */}
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu size={18} className="mr-2" />
              Navigation
              <ChevronDown size={16} className={`ml-auto transition-transform ${showMobileNav ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mobile Navigation Dropdown - Overlay style */}
          {showMobileNav && (
            <div
              ref={mobileNavRef}
              className="absolute top-full left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg max-h-[70vh] overflow-y-auto animate-slide-down"
            >
              <div className="px-4 py-4">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    if ('children' in item && item.children) {
                      // Mobile dropdown navigation item (User Mgnt only now)
                      const isUserMgmt = item.name === 'User Mgnt';
                      const isDropdownOpen = showUserMgmtDropdown;
                      const toggleDropdown = () => {
                        setShowUserMgmtDropdown(!showUserMgmtDropdown);
                      };

                      return (
                        <div key={item.name} className="space-y-1">
                          <button
                            onClick={toggleDropdown}
                            className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <item.icon size={18} className="mr-3" />
                            {item.name}
                            <ChevronDown size={16} className={`ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isDropdownOpen && (
                            <div className="ml-6 space-y-1">
                              {item.children.map((child: any) => (
                                <NavLink
                                  key={child.href}
                                  to={child.href}
                                  onClick={() => {
                                    setShowMobileNav(false);
                                    setShowUserMgmtDropdown(false);
                                  }}
                                  className={({ isActive }) => clsx(
                                    'flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors',
                                    isActive
                                      ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/50'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  )}
                                >
                                  <child.icon size={16} className="mr-3" />
                                  {child.name}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    } else if ('href' in item && item.href) {
                      // Mobile regular navigation item
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          onClick={() => setShowMobileNav(false)}
                          className={({ isActive }) => clsx(
                            'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          <item.icon size={18} className="mr-3" />
                          {item.name}
                        </NavLink>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Navigation Bar */}
          <nav className="hidden lg:block px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-6">
              {navigationItems.map((item) => {
                if ('children' in item && item.children) {
                  // Desktop dropdown navigation item (User Mgnt only now)
                  const isUserMgmt = item.name === 'User Mgnt';
                  const isDropdownOpen = showUserMgmtDropdown;
                  const toggleDropdown = () => {
                    setShowUserMgmtDropdown(!showUserMgmtDropdown);
                  };

                  return (
                    <div key={item.name} className="relative">
                      <button
                        onClick={toggleDropdown}
                        className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <item.icon size={18} className="mr-2" />
                        {item.name}
                        <ChevronDown size={16} className="ml-1" />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50" ref={userMgmtDropdownRef}>
                          {item.children.map((child: any) => (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              onClick={() => {
                                setShowUserMgmtDropdown(false);
                              }}
                              className={({ isActive }) => clsx(
                                'flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                                isActive
                                  ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/50'
                                  : 'text-gray-700 dark:text-gray-300'
                              )}
                            >
                              <child.icon size={16} className="mr-3" />
                              {child.name}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else if ('href' in item && item.href) {
                  // Desktop regular navigation item
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) => clsx(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      <item.icon size={18} className="mr-2" />
                      {item.name}
                    </NavLink>
                  );
                }
                return null;
              })}
            </div>
          </nav>
        </div>
      </header>

      <AISupportModal
        isOpen={showAISupportModal}
        onClose={() => setShowAISupportModal(false)}
      />

      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </>
  );
};
