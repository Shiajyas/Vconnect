import { Button } from "@/components/ui/button";
import { Bell, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { img_Url } from "@/images/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  unreadCount: number;
  openRightSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ unreadCount }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 p-4  text-white shadow-md flex justify-between items-center px-4 py-3 border-b w-full">
      <h1 className="text-lg font-bold">VConnect</h1>
     {/* <Avatar>
            <AvatarImage src={img_Url} alt="Logo" className="w-25 h-30" />
            <AvatarFallback>Logo</AvatarFallback>
          </Avatar> */}
      {/* Messages & Notifications */}
      <div className="flex items-center gap-3 relative">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home/messages")}>
          <MessageSquare className="w-5 h-5 text-white hover:text-gray-300" />
        </Button>

        <Button variant="ghost" size="icon" onClick={() => navigate("/home/notifications")} className="relative">
          <Bell className="w-5 h-5 text-white hover:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
              {unreadCount}
            </span>
          )}
        </Button>

     
      </div>
    </div>
  );
};

export default Header;
