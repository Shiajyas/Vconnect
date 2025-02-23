import React from "react";
import { Home, MessageSquare, Bell, PlusCircle, User, Search, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { img_Url } from "@/images/image";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

interface LeftSideBarProps {
  selectedItem: string;
  setSelectedItem: (item: string) => void;
  unreadNotifications: number;
}

const LeftSideBar: React.FC<LeftSideBarProps> = ({ selectedItem, setSelectedItem, unreadNotifications }) => {
  let navigate = useNavigate()
  const menuItems = [
    { name: "Home", icon: <Home /> },
    { name: "Messages", icon: <MessageSquare /> },
    { name: "Search", icon: <Search /> },
    { name: "Notifications", icon: <Bell />, hasBadge: true },
    { name: "Create", icon: <PlusCircle /> },
    { name: "Profile", icon: <User /> },
  ];
    const {logout} = useAuthContext()
  const handleLogout = () => {
    logout("user")
    navigate("/admin/dashbord")
  };

  return (
    <Card className="h-full w-full bg-background shadow-lg p-4 rounded-2xl flex flex-col">
      <CardContent className="flex flex-col items-center space-y-6 flex-grow">
        {/* Logo */}
        <div className="w-full flex justify-center">
          <Avatar>
            <AvatarImage src={img_Url} alt="Logo" className="w-25 h-30" />
            <AvatarFallback>Logo</AvatarFallback>
          </Avatar>
        </div>

        {/* Menu Items */}
        <div className="w-full space-y-3 mt-4 flex-grow">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`relative flex items-center w-full justify-start px-4 py-3 text-lg font-medium rounded-lg ${
                selectedItem === item.name ? "bg-accent text-primary font-bold" : "hover:bg-accent"
              }`}
              onClick={() => setSelectedItem(item.name)}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
              {item.hasBadge && unreadNotifications > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{unreadNotifications}</Badge>
              )}
            </Button>
          ))}
        </div>
      </CardContent>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 py-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default LeftSideBar;
