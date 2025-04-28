import { Button } from "@/components/ui/button";
import { Bell, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import useMessageStore from "@/appStore/useMessageStore";

interface HeaderProps {
  unreadCount: number; // notifications
}

const Header: React.FC<HeaderProps> = ({ unreadCount }) => {
  const navigate = useNavigate();

  const totalUnreadMessages = useMessageStore((state) =>
    Object.values(state.unreadCounts).reduce((acc, count) => acc + count, 0)
  );

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white shadow-md flex justify-between items-center w-full">
      <h1 className="text-lg font-bold">VConnect</h1>

      <div className="flex items-center gap-3 relative">
        {/* Messages Icon with badge */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home/messages")}>
            <MessageSquare className="w-5 h-5 text-white hover:text-gray-300" />
          </Button>
          {totalUnreadMessages > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
              {totalUnreadMessages}
            </span>
          )}
        </div>

        {/* Notifications Icon with badge */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home/notifications")}>
            <Bell className="w-5 h-5 text-white hover:text-gray-300" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
