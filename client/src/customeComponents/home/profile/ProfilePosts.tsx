import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Video as VideoIcon, List as ListIcon, Bookmark as BookmarkIcon, Grid as GridIcon } from "lucide-react";
import { useAuthStore } from "@/context/AuthContext";

interface ProfilePostsProps {
  userId: string;
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ userId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video">("all");
  const [activeTab, setActiveTab] = useState<"myPosts" | "savedPosts">("myPosts");

  const currentUserId = user?._id;

  // Fetch user’s posts
  const { data: mediaPosts, isLoading: isLoadingMedia } = useQuery({
    queryKey: ["userMediaPosts", userId],
    queryFn: () => userService.getUserMediaPosts(userId),
  });

  console.log(mediaPosts,">>>>>65")
  // Fetch saved posts (only if viewing own profile)
  const { data: savedPosts, isLoading: isLoadingSaved } = useQuery({
    queryKey: ["userSavedPosts", userId],
    queryFn: () => userService.getUserSavedPosts(userId),
    enabled: userId === currentUserId,
  });

  // Fetch followers & following
  const { data: followers } = useQuery({
    queryKey: ["followers", userId],
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
  });

  const { data: following } = useQuery({
    queryKey: ["following", userId],
    queryFn: () => userService.getFollowing(userId),
    enabled: !!userId,
  });

  const isImage = (url: string) => /\.(jpeg|jpg|png|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);
  const filteredPosts = (posts: any) => {
    if (!posts) return [];
  
    const data = Array.isArray(posts.posts) ? posts.posts : posts;
    if (!Array.isArray(data)) return [];
  
    return data.filter((post) => {
      const mediaUrl = Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrls;
      const isOwner = post.userId === currentUserId;
      const isFollower = followers?.some((f: any) => f._id === currentUserId);
      const isFollowing = following?.some((f: any) => f._id === post.userId);
  
      const hasAccess = isOwner || isFollower || isFollowing;
  
      // **Allow private posts for saved posts**
      if (activeTab !== "savedPosts" && !hasAccess && post.visibility === "private") {
        return false;
      }
  
      if (selectedType === "image") return isImage(mediaUrl);
      if (selectedType === "video") return isVideo(mediaUrl);
      return true;
    });
  };
  

  const currentPosts =
    activeTab === "myPosts"
      ? mediaPosts
      : currentUserId === userId
      ? savedPosts
      : [];

  const isLoading = activeTab === "myPosts" ? isLoadingMedia : isLoadingSaved;

  return (
    <div className="mt-6">
      {/* Tabs: My Posts & Saved Posts */}
      <div className="flex justify-center gap-4 mb-4">
        <Button
          variant={activeTab === "myPosts" ? "default" : "outline"}
          onClick={() => setActiveTab("myPosts")}
        >
          <GridIcon className="w-5 h-5 mr-2" /> My Posts
        </Button>
        {currentUserId === userId && (
          <Button
            variant={activeTab === "savedPosts" ? "default" : "outline"}
            onClick={() => setActiveTab("savedPosts")}
          >
            <BookmarkIcon className="w-5 h-5 mr-2" /> Saved Posts
          </Button>
        )}
      </div>

      {/* Filter: All / Images / Videos */}
      <div className="flex justify-center gap-2 mb-4">
        {["all", "image", "video"].map((type) => {
          const Icon = type === "image" ? ImageIcon : type === "video" ? VideoIcon : ListIcon;
          return (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              onClick={() => setSelectedType(type as "all" | "image" | "video")}
              className="flex items-center gap-2 md:gap-1 px-3 md:px-4"
            >
              <Icon className="w-5 h-5" />
              <span className="hidden md:inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </Button>
          );
        })}
      </div>

      {/* Posts Section */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredPosts(currentPosts)?.length ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredPosts(currentPosts).map((post) => {
            const mediaUrl = Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrls;
            return (
              <div
                key={post._id}
                className="relative cursor-pointer border-[0.5px] border-gray-300 rounded-md"
                onClick={() => navigate(`/home/post/${post._id}`)}
              >
                {isImage(mediaUrl) ? (
                  <img src={mediaUrl} alt="User Media" className="w-full h-24 object-cover rounded-md" />
                ) : (
                  <video className="w-full h-24 object-cover rounded-md" controls>
                    <source src={mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center">
          No {selectedType} {activeTab === "savedPosts" ? "saved" : "uploaded"} posts found
        </p>
      )}
    </div>
  );
};

export default ProfilePosts;
