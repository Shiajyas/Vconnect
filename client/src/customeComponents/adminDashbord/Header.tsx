import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useAuthStore } from "@/appStore/AuthStore";

const Header = () => {
  const { admin, logout } = useAuthStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-rose-400 shadow p-4 flex flex-col md:flex-row justify-between items-center">
      {/* Left Side: Logo or Title */}
      <h1 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-0">
        Admin Dashboard
      </h1>

      {/* Right Side: Admin Profile */}
      <div className="relative">
        <div
          className="flex items-center cursor-pointer"
          onClick={toggleDropdown}
        >
          {/* Profile Picture */}
          <img
            src={admin?.avatar || "https://via.placeholder.com/40"} // Fallback image
            alt="Profile"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full"
          />

          {/* Admin Name */}
          <span className="ml-2 text-gray-800 text-sm md:text-base">
            {admin?.username}
          </span>

          {/* Dropdown Icon */}
          <i
            className={`fa fa-chevron-${
              isDropdownOpen ? "up" : "down"
            } ml-2 text-gray-600`}
            aria-hidden="true"
          ></i>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
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
                  onClick={() => logout("admin")}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;