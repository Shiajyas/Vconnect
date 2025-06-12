import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

import { useAuthStore } from '@/appStore/AuthStore';
import { useReportStore } from '@/appStore/useReportStore';
import { adminReportService } from '@/services/adminReportService';
import { socket } from '@/utils/Socket';
// import type { Report } from '@/types/report';

type Report = {
  _id: string;
  postId: string;
  reporter: string;
  reason: string;
  createdAt: Date;
};  

import {
  UserCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

const Header = () => {
  const { admin, logout } = useAuthStore();
  const { reportCount, increment, setReportCount } = useReportStore();
  const queryClient = useQueryClient();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => setIsDropdownOpen(prev => !prev);

  // Initial report count fetch and socket setup
  useEffect(() => {
    const fetchInitialReportCount = async () => {
      try {
        const { count } = await adminReportService.getReportCount();
        setReportCount(count);
      } catch (err) {
        console.error("Failed to fetch report count:", err);
      }
    };

    fetchInitialReportCount();

    // Join admin room for real-time events
    socket.emit("admin:join");

    const handleNewReport = (report: Report) => {
      queryClient.setQueryData<Report[]>(["reports", 1], (prev = []) => {
        if (prev.some(r => r._id === report._id)) return prev;
        return [report, ...prev];
      });
      increment();
      toast.info("📨 New report received");
    };

    socket.on("admin:updateOnlineCount", setOnlineCount);
    socket.on("admin:newReport", handleNewReport);

    return () => {
      socket.off("admin:updateOnlineCount", setOnlineCount);
      socket.off("admin:newReport", handleNewReport);
    };
  }, [queryClient, increment, setReportCount]);

  // Close dropdown on outside click
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
      <h1 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-0">
        Admin Dashboard
      </h1>

      <div className="flex items-center space-x-6 relative">
        {/* Online Users */}
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

        {/* Reports Count */}
        <div className="flex items-center text-white gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-300" />
          <motion.span
            key={reportCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="font-medium"
          >
            Reports: {reportCount}
          </motion.span>
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center cursor-pointer" onClick={toggleDropdown}>
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
