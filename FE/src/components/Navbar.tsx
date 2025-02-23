// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Calendar, User, MoreVertical } from 'lucide-react'; // Removed Settings
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Single state for profile dropdown

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      navigate('/');
    }
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
    setIsProfileOpen(false); // Close dropdown after navigation
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          {/* Logo/Brand - Centered */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-semibold text-gray-900">AI Calendar</span>
          </div>

          {/* Profile Dropdown (Right Side) */}
          {user && (
            <div className="ml-auto relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <img
                  src={user.image}
                  alt={`${user.name}'s profile`}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                  {user.name}
                </span>
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50">
                  <button
                    onClick={handleEditProfile}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 focus:outline-none"
                  >
                    Manage your Google Account
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                  >
                    Sign out of all accounts
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Privacy Policy • Terms of Service
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;