import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';

export const Layout: React.FC = () => {
  const { isAuthenticated, fetchCurrentUserProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUserProfile();
    }
  }, [isAuthenticated, fetchCurrentUserProfile]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
