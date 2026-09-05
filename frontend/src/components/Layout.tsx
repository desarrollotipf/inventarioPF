import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuthStore } from '../store/authStore';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      {/* Top Fixed Enterprise Navigation */}
      <Navbar />

      {/* Main Enterprise Content View (Full Width) */}
      <main className="flex-1 max-w-[98%] w-full mx-auto px-3 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
