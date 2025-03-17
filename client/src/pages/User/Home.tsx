import { useEffect, useState } from "react";
import HomeRoutes from "@/routes/HomeRoutes";
import { Outlet } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import Status from "@/customeComponents/home/Status";
import RightSideBar from "@/customeComponents/home/RightSideBar";
import LeftSideBar from "@/customeComponents/home/LeftSideBar";

import useNotificationStore from "@/store/notificationStore";
import { useAuthStore } from "@/context/AuthContext";
import { socket } from "@/utils/Socket";

const HomeLayout: React.FC = () => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const userId = user?._id || null;

  // State for selected menu item in LeftSideBar
  const [selectedItem, setSelectedItem] = useState("Home");

  useEffect(() => {
    if (!userId) return;
    socket.emit("joinUser", userId);
    return () => {
      socket.emit("leaveUser", userId);
    };
  }, [userId]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,320px] gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Sidebar */}
        <div className="hidden lg:block">
          <LeftSideBar
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            unreadNotifications={unreadCount}
          />
        </div>

        {/* Main Content */}
        <Card className="h-[calc(100vh-4rem)]">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Status Bar */}
            <div className="sticky top-0 bg-white z-20 p-4 border-b">
              <Status />
              <Separator />
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* <HomeRoutes /> */}
                <Outlet />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="hidden lg:block h-[calc(100vh-4rem)]">
          <Card className="sticky top-6 h-full flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <ScrollArea className="h-full scrollbar-hide">
                <RightSideBar />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeLayout;
