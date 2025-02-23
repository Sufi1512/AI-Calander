// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Calendar, User, Settings, MoreVertical, CheckCircle } from 'lucide-react'; // Added CheckCircle
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // State for logout modal
  const [showTick, setShowTick] = useState(false); // State for tick animation

  const handleLogout = () => {
    setIsLogoutModalOpen(true); // Open logout confirmation modal
  };

  const confirmLogout = () => {
    setShowTick(true); // Show tick animation
    setTimeout(() => {
      logout();
      navigate('/');
      setIsLogoutModalOpen(false);
      setShowTick(false); // Reset states after logout
    }, 1000); // Delay logout for 1 second to show tick
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
    setIsProfileOpen(false);
  };

  // Animation variants for dropdown
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  // Animation variants for modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // Tick animation
  const tickVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <>
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white tracking-tight">AI Calendar</span>
            </motion.div>

            {/* User Actions */}
            {user && (
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-white bg-opacity-20 cursor-pointer"
                >
                  <Settings className="h-5 w-5 text-white" />
                </motion.div>

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 bg-white bg-opacity-20 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                  >
                    <img
                      src={user.image || user.picture}
                      alt={`${user.name}'s profile`}
                      className="h-9 w-9 rounded-full object-cover border-2 border-white"
                    />
                    <span className="text-sm font-medium text-white truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <MoreVertical className="h-4 w-4 text-white" />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100"
                      >
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleEditProfile}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-colors duration-200"
                        >
                          Manage your Google Account
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
                        >
                          Sign out
                        </button>
                        <div className="border-t border-gray-200 mt-2 pt-2 px-4">
                          <p className="text-xs text-gray-500">
                            <a href="#" className="hover:underline">Privacy Policy</a> •{' '}
                            <a href="#" className="hover:underline">Terms of Service</a>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={cancelLogout}
            />

            {/* Modal Content */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative overflow-hidden">
                {!showTick ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Are you sure you want to logout?
                    </h3>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={cancelLogout}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                      >
                        No
                      </button>
                      <button
                        onClick={confirmLogout}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                      >
                        Yes
                      </button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    variants={tickVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center justify-center h-full py-6"
                  >
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="mt-4 text-lg font-medium text-gray-900">Logging out...</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;