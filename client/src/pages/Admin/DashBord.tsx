import React, { useState } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import UserList from "../../components/adminDashbord/UserList";
import Spinner from "../../components/common/Spinner";

const AdminDashboard = () => {
  const { admin, logout, isLoading, isError } = useAdminAuth();
  const [activeSection, setActiveSection] = useState("dashboard"); 

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !admin) {
    return <div>Error loading admin data. Please log in again.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700 text-center md:text-left">
          Admin Panel
        </div>
        <div className="p-4 flex-grow">
          <ul>
            <li
              onClick={() => setActiveSection("dashboard")}
              className={`py-2 px-4 rounded cursor-pointer ${
                activeSection === "dashboard" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              Dashboard
            </li>
            <li
              onClick={() => setActiveSection("userList")}
              className={`py-2 px-4 rounded cursor-pointer ${
                activeSection === "userList" ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              User List
            </li>
          </ul>
        </div>
        <div className="p-4 text-center md:text-left">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-100 p-4 shadow flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Admin Dashboard</h1>
          <div className="text-center md:text-right">
            <p className="text-sm font-medium">Welcome, {admin.username}</p>
            <p className="text-sm text-gray-500">{admin.email}</p>
          </div>
      
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {activeSection === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Welcome, {admin.username}!</h2>
              <p className="text-gray-700">
                This is your admin dashboard!!!
              </p>
            </div>
          )}
          {activeSection === "userList" && <UserList />}
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 p-4 text-center shadow">
          <p className="text-sm text-gray-500">
            © 2025 Admin Panel. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
