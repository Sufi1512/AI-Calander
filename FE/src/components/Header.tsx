import React from 'react';
import { Calendar, Settings, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold">AI Calendar</span>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Settings className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" />
              <div className="flex items-center">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
                <button
                  onClick={logout}
                  className="ml-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}