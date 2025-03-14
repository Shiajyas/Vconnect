  import { useEffect, useState, useCallback } from "react";
  import { useQuery } from "@tanstack/react-query";
  import { useNavigate } from "react-router-dom";
  import { Home, Bell, PlusCircle, User } from "lucide-react";

  import Status from "@/customeComponents/home/Status";
  import RightSideBar from "@/customeComponents/home/RightSideBar";
  import LeftSideBar from "@/customeComponents/home/LeftSideBar";
  import Notification from "@/customeComponents/home/Notification";
  import PostUpload from "@/customeComponents/home/post/postUploadComponent";
  import PostList from "@/customeComponents/home/post/PostList";
  import PostDetails from "@/customeComponents/home/post/PostDetails";
  import ProfilePage from "@/customeComponents/home/profile/ProfilePage";

  import { ScrollArea } from "@/components/ui/scroll-area";
  import { Card, CardContent } from "@/components/ui/card";
  import { Separator } from "@/components/ui/separator";
  import { Button } from "@/components/ui/button";
  import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

  import useNotificationStore from "@/store/notificationStore";
  import { useAuthStore } from "@/context/AuthContext";
  import { userService } from "@/services/userService";
  import { socket } from "@/utils/Socket";

  const Homes: React.FC = () => {
    const navigate = useNavigate();
    const { unreadCount, setUnreadCount, resetUnreadCount } = useNotificationStore();
    const { user } = useAuthStore();
    const userId = user?._id || null; // Logged-in userId

    const [selectedItem, setSelectedItem] = useState("Home");
    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null); // Track selected profile

    // Socket connection for notifications
    useEffect(() => {
      if (!userId) return;
      socket.emit("joinUser", userId);
      return () => {
        socket.emit("leaveUser", userId);
      };
    }, [userId]);

    // Fetch unread notifications count
    const { data: unreadData, refetch } = useQuery({
      queryKey: ["unreadCount", userId],
      queryFn: async () => userService.getNotificationCount(userId as string),
      enabled: !!userId,
      staleTime: 60000,
    });

    const handleSelectPost = useCallback((postId: string) => {
      setSelectedPost(postId);
      setSelectedItem("Home");
    }, []);

    // Update unread notifications count when data changes
    useEffect(() => {
      if (unreadData?.unreadCount !== undefined) {
        setUnreadCount(unreadData.unreadCount);
      }
    }, [unreadData, setUnreadCount]);
    const handleTabChange = useCallback(
      (tab: string, profileId?: string) => {
        setSelectedItem(tab);
        setSelectedPost(null); // Reset post selection
        setSelectedProfileId(profileId || userId); // Default to logged-in user
    
        if (tab === "Notifications") {
          resetUnreadCount();
          refetch();
        }
      },
      [resetUnreadCount, refetch, userId]
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
              userId={userId} // Pass userId dynamically
            />
          </div>

          {/* Main Content */}
          <Card className="h-[calc(100vh-4rem)]">
            <CardContent className="p-0 h-full flex flex-col">
              
              {/* Fixed Status Bar */}
              {selectedItem === "Home" && !selectedPost && (
                <div className="sticky top-0 bg-white z-20 p-4 border-b">
                  <Status />
                  <Separator />
                </div>
              )}

              {/* Scrollable Main Section */}
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  
                  {/* Create Post Section */}
                  {selectedItem === "Create" && (
                    <>
                      <PostUpload userId={userId} token={localStorage.getItem("userToken") || ""} />
                      <Separator />
                    </>
                  )}

                  {/* Home - Show Post List or Post Details */}
                  {selectedItem === "Home" &&
                    (selectedPost ? (
                      <div className="w-full min-w-full mx-auto p-0">
                        <Button onClick={() => setSelectedPost(null)} variant="outline" className="mb-4">
                          ← Back to Posts
                        </Button>
                        <PostDetails postId={selectedPost} />
                      </div>
                    ) : (
                      <PostList onSelectPost={setSelectedPost} />
                    ))}

                  {/* Notifications */}
                  {selectedItem === "Notifications" && (
                    <>
                      <Notification setSelectedPost={handleSelectPost} />
                      <Separator />
                    </>
                  )}

{selectedItem === "Profile" && (
  <ProfilePage userId={selectedProfileId || userId} />
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
            <Button variant={selectedItem === "Home" ? "default" : "secondary"} onClick={() => handleTabChange("Home")}>
              <Home className="w-5 h-5" />
            </Button>

            <Button variant={selectedItem === "Create" ? "default" : "ghost"} onClick={() => handleTabChange("Create")}>
              <PlusCircle className="w-5 h-5" />
            </Button>

            <Button variant={selectedItem === "Notifications" ? "default" : "ghost"} onClick={() => handleTabChange("Notifications")}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="ml-1 text-xs text-red-500">{unreadCount}</span>}
            </Button>

            {/* Mobile Right Sidebar Popup */}
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
