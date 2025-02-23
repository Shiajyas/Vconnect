import React, { useState } from "react";
import { useAdminAuth } from "../../../hooks/useAdminAuth";
import Main from "../main/Main";
import AdminManagement from "../adminManagement/AdminManagement";
import Spam from "../spamManagement/Spam";
import UsersManagement from "../usersManagemen/UsersManagemen";
import Spinner from "../../common/Spinner";
import Header from "../Header";
import { img_Url } from "../../../images/image";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// Define the type for menu items
type MenuItem = {
  id: number;
  title: string;
  icon: string;
  component: React.ReactNode;
};

const Sidebar = () => {
  const [adminMenu, setAdminMenu] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to control sidebar visibility
  const {  isLoading } = useAdminAuth();
const {logout} = useAuthContext()
  // Define the menu items

  const navigate = useNavigate()

  const handleLogout = ()=>{
    logout("admin")
    navigate("/admin/login")
  }

  const menuItems: MenuItem[] = [
    {
      id: 1,
      title: "Dashboard",
      icon: "fa fa-th",
      component: <Main />,
    },
    {
      id: 2,
      title: "Admin Management",
      icon: "fa fa-lock",
      component: <AdminManagement />,
    },
    {
      id: 3,
      title: "Spams Management",
      icon: "fa fa-ban",
      component: <Spam />,
    },
    {
      id: 4,
      title: "Users Management",
      icon: "fa fa-wrench",
      component: <UsersManagement />,
    },
  ];

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar Toggle Button (Mobile) */}
      <button
        className="fixed md:hidden z-50 bottom-4 right-4 p-3 bg-rose-600 text-white rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <i className={`fa fa-${isSidebarOpen ? "times" : "bars"}`} aria-hidden="true"></i>
      </button>

      {/* Sidebar */}
      <div
        className={`w-64 bg-rose-600 text-white flex flex-col fixed md:relative h-screen z-40 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white-700">
          <div className="flex items-center justify-between">
            {/* Logo and Text Combined */}
            <div className="flex items-center space-x-2">
              <img
                src={img_Url}
                alt="Logo"
                className="w-10 h-10 rounded-full" // Adjusted size and border radius
              />
              <h1 className="text-xl font-bold">Connect</h1>
            </div>
            <i
              className="fa fa-times cursor-pointer md:hidden"
              aria-hidden="true"
              onClick={() => setIsSidebarOpen(false)}
            ></i>
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center p-2 my-1 rounded cursor-pointer ${
                adminMenu === item.id ? "bg-gray-300" : "hover:bg-gray-300"
              }`}
              onClick={() => {
                setAdminMenu(item.id);
                setIsSidebarOpen(false); // Close sidebar on menu click (mobile)
              }}
            >
              <i className={`${item.icon} mr-3`} aria-hidden="true"></i>
              <span>{item.title}</span>
            </div>
          ))}

          {/* Logout Button */}
          <div className="mt-4">
            <div
              className="flex items-center p-2 my-1 rounded cursor-pointer hover:bg-gray-700"
              onClick={handleLogout}
            >
              <i className="fa fa-power-off mr-3" aria-hidden="true"></i>
              <span>Log out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {menuItems.find((item) => item.id === adminMenu)?.component}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
