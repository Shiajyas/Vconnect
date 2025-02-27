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
import PostUpload from "@/customeComponents/home/post/postUploadComponent";
import PostList from "@/customeComponents/home/post/PostList";
import { useAuthStore } from "@/context/AuthContext";
import PostDetails from "@/customeComponents/home/post/PostDetails";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"; // Right sidebar popup
import { Home, Bell, PlusCircle, User } from "lucide-react";

const Homes: React.FC = () => {
  const { unreadCount, setUnreadCount, resetUnreadCount } = useNotificationStore();
  const [selectedItem, setSelectedItem] = useState("Home");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const { user } = useAuthStore();
  const userId = user?._id || null;

  useEffect(() => {
    if (!userId) return;
    socket.emit("joinUser", userId);
    return () => {
      socket.emit("leaveUser", userId);
    };
  }, [userId]);

  const { data: unreadData, refetch } = useQuery({
    queryKey: ["unreadCount", userId],
    queryFn: async () => userService.getNotificationCount(userId),
    enabled: !!userId,
    staleTime: 60000,
  });

  useEffect(() => {
    if (unreadData?.unreadCount !== undefined) {
      setUnreadCount(unreadData.unreadCount);
    }
  }, [unreadData, setUnreadCount]);

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
        {/* Left Sidebar (Hidden on Mobile) */}
        <div className="hidden lg:block">
          <LeftSideBar
            selectedItem={selectedItem}
            setSelectedItem={handleTabChange}
            unreadNotifications={unreadCount}
          />
        </div>

        {/* Main Content */}
        <Card className="h-[calc(100vh-4rem)]">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Fixed Status Component */}
            {selectedItem === "Home" && !selectedPost && (
  <div className="sticky top-0 bg-white z-20 p-4 border-b">
    <Status />
    <Separator />
  </div>
)}

            {/* Scrollable Main Section */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {selectedItem === "Create" && (
                  <>
                    <PostUpload userId={userId} token={localStorage.getItem("userToken") || ""} />
                    <Separator />
                  </>
                )}

                {/* Home Page - Show Post List or Post Details */}
                {selectedItem === "Home" &&
                  (selectedPost ? (
                    <div className="p-4">
                      <Button onClick={() => setSelectedPost(null)} variant="outline">
                        ← Back to Posts
                      </Button>
                      <PostDetails postId={selectedPost} />
                    </div>
                  ) : (
                    <PostList onSelectPost={setSelectedPost} />
                  ))}

                {selectedItem === "Notifications" && (
                  <>
                    <Notification />
                    <Separator />
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Sidebar (Hidden on Mobile, Popup Instead) */}
        <div className="hidden lg:block h-[calc(100vh-4rem)]">
          <Card className="sticky top-6 h-full flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <ScrollArea className="h-full scrollbar-hide">
                <RightSideBar />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-3">
          <Button
            variant={selectedItem === "Home" ? "default" : "ghost"}
            onClick={() => setSelectedItem("Home")}
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedItem === "Create" ? "default" : "ghost"}
            onClick={() => setSelectedItem("Create")}
          >
            <PlusCircle className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedItem === "Notifications" ? "default" : "ghost"}
            onClick={() => setSelectedItem("Notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="ml-1 text-xs text-red-500">{unreadCount}</span>}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost">
                <User className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-4">
              <RightSideBar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default Homes;
