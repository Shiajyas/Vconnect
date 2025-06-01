import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const Header = () => {
  const { admin, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);

useEffect(() => {
  socket.on("admin:updateOnlineCount", (count: number) => {
    console.log("Online users updated:", count);
    setOnlineCount(count);
  });

  return () => {
    socket.off("admin:updateOnlineCount");
  };
}, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-rose-500 shadow p-4 flex flex-col md:flex-row justify-between items-center">
      {/* Title */}
      <h1 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-0">Admin Dashboard</h1>

      {/* Right section */}
      <div className="flex items-center space-x-6 relative">
        {/* Online Count */}
        <div className="flex items-center text-white gap-2">
          <span className="relative">
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 relative"></span>
          </span>
          <UserCircle className="w-5 h-5" />
          <motion.span
            key={onlineCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-medium"
          >
            Online: {onlineCount}
          </motion.span>
        </div>

        {/* Admin Avatar and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center cursor-pointer"
            onClick={toggleDropdown}
          >
            <img
              src={admin?.avatar || '/assets/default-avatar.png'}
              alt="Avatar"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
            />
            <span className="ml-2 text-white text-sm md:text-base">{admin?.username}</span>
            {isDropdownOpen ? (
              <ChevronUp className="ml-2 text-white w-4 h-4" />
            ) : (
              <ChevronDown className="ml-2 text-white w-4 h-4" />
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
              >
                <ul>
                  <li>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => logout('admin')}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
