import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Status from "@/customeComponents/home/Status";
import RightSideBar from "@/customeComponents/home/RightSideBar";
import LeftSideBar from "@/customeComponents/home/LeftSideBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Notification from "@/customeComponents/home/Notification";
import useNotificationStore from "@/store/notificationStore";
import { userService } from "@/services/userService";
import { socket } from "@/utils/Socket";
import PostUpload from "@/customeComponents/post/postUploadComponent";
import PostList from "@/customeComponents/post/PostList";
import { useAuthStore } from "@/context/AuthContext";

const Home: React.FC = () => {
  const { unreadCount, setUnreadCount, resetUnreadCount } = useNotificationStore();
  const [selectedItem, setSelectedItem] = useState("Home");
 const {user} = useAuthStore()
  const userId = user?._id || null;

  // Handle user joining and leaving socket
  useEffect(() => {
    if (!userId) return;

    console.log("Emitting joinUser event for:", userId);
    socket.emit("joinUser", userId);

    return () => {
      console.log("User leaving:", userId);
      socket.emit("leaveUser", userId);
    };
  }, [userId]);

  // Fetch unread notification count
  const { data: unreadData, refetch } = useQuery({
    queryKey: ["unreadCount", userId],
    queryFn: async () => {
      console.log("Fetching notification count for user:", userId);
      return await userService.getNotificationCount(userId);
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  // Update unread count when new data arrives
  useEffect(() => {
    if (unreadData?.unreadCount !== undefined) {
      setUnreadCount(unreadData.unreadCount);
    }
  }, [unreadData, setUnreadCount]);

  // Reset unread count when switching to Notifications tab
  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedItem(tab);
      if (tab === "Notifications") {
        resetUnreadCount();
        refetch();
      }
    },
    [resetUnreadCount, refetch]
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,320px] gap-6 h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <LeftSideBar
          selectedItem={selectedItem}
          setSelectedItem={handleTabChange}
          unreadNotifications={unreadCount}
        />

        {/* Main Content */}
        <Card className="h-[calc(100vh-4rem)]">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Fixed Status Component */}
            {selectedItem === "Home" && (
              <div className="sticky top-0 bg-white z-10 p-4 border-b">
                <Status />
                <Separator />
              </div>
            )}

            {/* Scrollable Posts Section */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {selectedItem === "Create" && (
                  <>
                    <PostUpload userId={userId} token={localStorage.getItem("userToken") || ""} />
                    <Separator />
                  </>
                )}

                {selectedItem === "Home" && <PostList />}
              </div>
            </ScrollArea>

            <ScrollArea >
              <div >
                {selectedItem === "Notifications" && (
                  <>
                    <Notification  />
                    <Separator />
                  </>
                )}

                {selectedItem === "Home" && <PostList />}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Sidebar (Sticky) */}
        <div className="h-[calc(100vh-4rem)]">
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

export default Home;
